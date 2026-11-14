import {
  canManageWeights,
  jsonPrivate,
  requirePrivilegedViewer,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requirePrivilegedViewer(req);
  if (user instanceof Response) return user;
  if (!canManageWeights(user.role)) {
    return jsonPrivate({ code: 403, message: "无权限" }, { status: 403 });
  }

  const cycles = await prisma.evalCycle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { subjects: true, relations: true, ballots: true } },
    },
  });

  return jsonPrivate({
    code: 200,
    data: cycles.map((c) => ({
      id: c.id,
      cycleName: c.cycleName,
      cycleYear: c.cycleYear,
      status: c.status,
      startTime: c.startTime,
      endTime: c.endTime,
      counts: c._count,
    })),
  });
}
