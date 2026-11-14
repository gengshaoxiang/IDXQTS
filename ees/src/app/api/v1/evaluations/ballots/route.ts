import { z } from "zod";
import { canSubmitBallot, jsonPrivate, resolveSessionUser } from "@/lib/auth";
import { makeBlindToken } from "@/lib/crypto/blind-token";
import { prisma } from "@/lib/prisma";
import { computeRawWeightedScore } from "@/lib/scoring/calculate";
import { validateStarEvidence } from "@/lib/scoring/star-validation";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  relationId: z.string().min(1),
  scores: z
    .array(
      z.object({
        dimension_code: z.string(),
        item_code: z.string(),
        score: z.number().min(1).max(5),
        star_evidence: z
          .object({
            situation_task: z.string(),
            action: z.string(),
            result: z.string(),
          })
          .optional()
          .nullable(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const user = await resolveSessionUser(req);
  if (user instanceof Response) return user;
  if (!canSubmitBallot(user.role)) {
    return jsonPrivate({ code: 403, message: "无权限" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonPrivate(
      { code: 400, message: "参数错误", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { relationId, scores } = parsed.data;
  const relation = await prisma.evalRelation.findUnique({
    where: { id: relationId },
    include: { cycle: true },
  });

  if (!relation || relation.evaluatorUserId !== user.id) {
    return jsonPrivate({ code: 404, message: "任务不存在" }, { status: 404 });
  }
  if (relation.cycle.status !== "ACTIVE") {
    return jsonPrivate(
      { code: 409, message: "周期非 ACTIVE，禁止提交" },
      { status: 409 },
    );
  }
  if (relation.taskStatus === "COMPLETED") {
    return jsonPrivate(
      { code: 409, message: "该评价任务已提交，禁止重复提交或篡改" },
      { status: 409 },
    );
  }

  const starCheck = validateStarEvidence(scores);
  if (!starCheck.ok) {
    return jsonPrivate(
      {
        code: 422,
        message: "触发极端分数阈值但缺少有效 STAR 行为举证",
        errors: starCheck.errors,
      },
      { status: 422 },
    );
  }

  const blindToken = makeBlindToken(
    relation.cycleId,
    user.id,
    relation.cycle.secretSalt,
  );
  const rawWeightedScore = computeRawWeightedScore(scores);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.evalBallot.create({
        data: {
          cycleId: relation.cycleId,
          subjectId: relation.subjectId,
          evaluatorBlindToken: blindToken,
          relationRole: relation.relationRole,
          scoresPayload: JSON.stringify(scores),
          rawWeightedScore,
        },
      });
      await tx.evalRelation.update({
        where: { id: relation.id },
        data: { taskStatus: "COMPLETED", submittedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "SUBMIT_BALLOT",
          entityType: "EvalRelation",
          entityId: relation.id,
          afterJson: JSON.stringify({
            subjectId: relation.subjectId,
            relationRole: relation.relationRole,
            rawWeightedScore,
          }),
        },
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return jsonPrivate(
        { code: 409, message: "该评价任务已提交，禁止重复提交或篡改" },
        { status: 409 },
      );
    }
    throw e;
  }

  return jsonPrivate({ code: 200, data: { ok: true, rawWeightedScore } });
}
