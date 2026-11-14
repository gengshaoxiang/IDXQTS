import {
  canEnterVeto,
  jsonPrivate,
  requirePrivilegedViewer,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCycleCalculation } from "@/lib/scoring/run-cycle";

export const dynamic = "force-dynamic";

/** Second signed-in privileged user must approve; reporter cannot self-approve. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requirePrivilegedViewer(req);
  if (user instanceof Response) return user;
  if (!canEnterVeto(user.role)) {
    return jsonPrivate({ code: 403, message: "无核准权限" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const veto = await prisma.complianceVeto.findUnique({ where: { id } });
  if (!veto) {
    return jsonPrivate({ code: 404, message: "记录不存在" }, { status: 404 });
  }
  if (veto.isActive) {
    return jsonPrivate({ code: 409, message: "已生效，无需重复核准" }, { status: 409 });
  }
  if (veto.reportedBy === user.id) {
    return jsonPrivate(
      { code: 422, message: "双人复核：核准人不能与提报人为同一登录用户" },
      { status: 422 },
    );
  }

  const updated = await prisma.complianceVeto.update({
    where: { id },
    data: {
      approvedBy: user.id,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "APPROVE_VETO",
      entityType: "ComplianceVeto",
      entityId: updated.id,
      afterJson: JSON.stringify({
        approvedBy: user.id,
        reportedBy: veto.reportedBy,
      }),
    },
  });

  const cycle = await prisma.evalCycle.findUnique({
    where: { id: updated.cycleId },
  });
  if (cycle && ["CALIBRATING", "PUBLISHED", "ACTIVE"].includes(cycle.status)) {
    await runCycleCalculation(updated.cycleId);
  }

  return jsonPrivate({ code: 200, data: updated });
}
