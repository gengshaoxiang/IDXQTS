import {
  canEnterVeto,
  canViewCalibration,
  jsonPrivate,
  requirePrivilegedViewer,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ cycleId: string }> },
) {
  const user = await requirePrivilegedViewer(req);
  if (user instanceof Response) {
    return user;
  }
  if (!canViewCalibration(user.role) && !canEnterVeto(user.role)) {
    return jsonPrivate({ code: 403, message: "无权限" }, { status: 403 });
  }

  const { cycleId } = await ctx.params;
  const subjects = await prisma.evalSubject.findMany({
    where: { cycleId },
    orderBy: { userName: "asc" },
  });

  const data = subjects.map((s) => ({
    id: s.id,
    userName: s.userName,
    positionTitle: s.positionTitle,
    departmentName: s.departmentName,
  }));

  return jsonPrivate({ code: 200, data });
}
