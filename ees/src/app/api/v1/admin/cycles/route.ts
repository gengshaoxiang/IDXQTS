import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const cycles = await prisma.evalCycle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { subjects: true, relations: true, ballots: true } },
    },
  });

  return NextResponse.json({
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
