import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const DEMO_USER_COOKIE = "ees_demo_user";

export type SessionUser = {
  id: string;
  name: string;
  role: string;
  title: string;
  deptName: string;
};

/** 演示态：Cookie 切换身份；生产由企微 OAuth2 SSO 替换 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = jar.get(DEMO_USER_COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    title: user.title,
    deptName: user.deptName,
  };
}

export function canManageWeights(role: string): boolean {
  return role === "ROLE_SUPER_ADMIN" || role === "ROLE_HRD_ADMIN";
}

export function canManageRelations(role: string): boolean {
  return role === "ROLE_SUPER_ADMIN" || role === "ROLE_HRD_ADMIN";
}

export function canSubmitBallot(role: string): boolean {
  return [
    "ROLE_CEO",
    "ROLE_EXECUTIVE",
    "ROLE_EVALUATOR",
    "ROLE_HRD_ADMIN",
    "ROLE_SUPER_ADMIN",
  ].includes(role);
}

export function canEnterVeto(role: string): boolean {
  return role === "ROLE_AUDIT_OFFICER" || role === "ROLE_SUPER_ADMIN";
}

export function canViewCalibration(role: string): boolean {
  return [
    "ROLE_SUPER_ADMIN",
    "ROLE_HRD_ADMIN",
    "ROLE_CEO",
    "ROLE_AUDIT_OFFICER",
  ].includes(role);
}

export function canTriggerCalculate(role: string): boolean {
  return role === "ROLE_HRD_ADMIN" || role === "ROLE_SUPER_ADMIN";
}

export function canViewPersonalReport(
  role: string,
  viewerId: string,
  subjectUserId: string,
): boolean {
  if (
    role === "ROLE_SUPER_ADMIN" ||
    role === "ROLE_HRD_ADMIN" ||
    role === "ROLE_CEO"
  ) {
    return true;
  }
  return viewerId === subjectUserId;
}
