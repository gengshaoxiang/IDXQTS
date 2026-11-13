import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ cycleId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }
  const { cycleId } = await ctx.params;
  const subjects = await prisma.evalSubject.findMany({
    where: { cycleId },
    orderBy: { userName: "asc" },
  });
  return NextResponse.json({
    code: 200,
    data: subjects.map((s) => ({
      id: s.id,
      userName: s.userName,
      positionTitle: s.positionTitle,
      departmentName: s.departmentName,
    })),
  });
}
