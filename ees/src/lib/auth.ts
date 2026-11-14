import { prisma } from "./prisma";
import {
  getIdentity,
  requireIdentity,
  requireTeamRole,
  type VerifiedIdentity,
} from "../../cursor/identity";

export type SessionUser = {
  id: string;
  name: string;
  role: string;
  title: string;
  deptName: string;
  email: string;
  simulated: boolean;
};

function roleFromIdentity(identity: VerifiedIdentity): string {
  if (identity.kind === "key") {
    return "ROLE_EVALUATOR";
  }
  // Private invitees are a trusted audience; team admins get HRD powers.
  if (identity.appVisibility === "private") {
    return "ROLE_HRD_ADMIN";
  }
  if (identity.appVisibility === "team" && identity.teamRole === "admin") {
    return "ROLE_HRD_ADMIN";
  }
  return "ROLE_EVALUATOR";
}

function appUserIdFor(identity: VerifiedIdentity): string {
  // Stable per viewer; never parse or display the raw sub beyond this keying.
  const digest = identity.sub.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 48);
  return `cursor_${digest}`;
}

/** Resolve the signed-in Cursor viewer into an AppUser. Never trust client-supplied user ids. */
export async function resolveSessionUser(
  request: Request,
): Promise<SessionUser | Response> {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const id = appUserIdFor(identity);
  const role = roleFromIdentity(identity);
  const name =
    identity.kind === "person"
      ? identity.name || identity.email || "已登录用户"
      : identity.name || "服务调用方";
  const email = identity.kind === "person" ? identity.email : "";

  const user = await prisma.appUser.upsert({
    where: { id },
    create: {
      id,
      name,
      role,
      title: role === "ROLE_HRD_ADMIN" ? "组织发展管理员" : "评价人",
      deptName: "Cursor 登录用户",
    },
    update: {
      name,
      role,
    },
  });

  if (role === "ROLE_HRD_ADMIN" || role === "ROLE_EVALUATOR") {
    await ensureDemoRelations(user.id, role);
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    title: user.title,
    deptName: user.deptName,
    email,
    simulated: identity.simulated === true,
  };
}

export async function getOptionalSessionUser(
  request: Request,
): Promise<SessionUser | null> {
  const identity = await getIdentity(request);
  if (!identity.verified) return null;
  const resolved = await resolveSessionUser(request);
  if (resolved instanceof Response) return null;
  return resolved;
}

/** Privileged ops: Cursor team admin, or any verified person on a private app. */
export async function requirePrivilegedViewer(
  request: Request,
): Promise<SessionUser | Response> {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  if (identity.appVisibility === "team") {
    const admin = requireTeamRole(identity, ["admin"]);
    if (admin instanceof Response) return admin;
  } else if (identity.appVisibility !== "private" || identity.kind !== "person") {
    return Response.json(
      { code: 403, message: "需要管理员权限" },
      { status: 403, headers: { "cache-control": "private, no-store" } },
    );
  }

  return resolveSessionUser(request);
}

/** Attach a couple of demo evaluation tasks to the signed-in user (no impersonation). */
async function ensureDemoRelations(userId: string, role: string) {
  const cycle = await prisma.evalCycle.findFirst({
    where: { status: { in: ["ACTIVE", "CALIBRATING"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!cycle) return;

  const subjects = await prisma.evalSubject.findMany({
    where: { cycleId: cycle.id },
    take: 2,
  });
  if (!subjects.length) return;

  const existing = await prisma.evalRelation.count({
    where: { cycleId: cycle.id, evaluatorUserId: userId },
  });
  if (existing > 0) return;

  const relationRole = role === "ROLE_HRD_ADMIN" ? "HRD" : "PEER";
  for (const subject of subjects) {
    await prisma.evalRelation.create({
      data: {
        cycleId: cycle.id,
        subjectId: subject.id,
        evaluatorUserId: userId,
        relationRole,
        taskStatus: "PENDING",
      },
    });
  }
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
    "ROLE_AUDIT_OFFICER",
  ].includes(role);
}

export function canEnterVeto(role: string): boolean {
  return (
    role === "ROLE_AUDIT_OFFICER" ||
    role === "ROLE_SUPER_ADMIN" ||
    role === "ROLE_HRD_ADMIN"
  );
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

export function jsonPrivate(data: unknown, init?: { status?: number }) {
  return Response.json(data, {
    status: init?.status ?? 200,
    headers: { "cache-control": "private, no-store" },
  });
}
