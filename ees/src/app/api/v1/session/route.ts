import { NextRequest, NextResponse } from "next/server";
import { DEMO_USER_COOKIE, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  const users = await prisma.appUser.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ code: 200, data: { user, users } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = String(body.userId ?? "");
  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ code: 404, message: "用户不存在" }, { status: 404 });
  }
  const res = NextResponse.json({ code: 200, data: user });
  res.cookies.set(DEMO_USER_COOKIE, user.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
