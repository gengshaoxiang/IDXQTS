import { SUBORDINATE_POOL_THRESHOLD } from "../dimensions";

export type BallotLike = {
  relationRole: string;
  calibratedScore: number;
};

/**
 * 下属人数阈值池化（文档 4.3）
 * N_sub < 3 时，下属选票并入 PEER 池参与加权。
 */
export function resolveRoleForWeighting(
  relationRole: string,
  subordinateCount: number,
): { effectiveRole: string; subordinatePooled: boolean } {
  if (
    relationRole === "SUBORDINATE" &&
    subordinateCount < SUBORDINATE_POOL_THRESHOLD
  ) {
    return { effectiveRole: "PEER", subordinatePooled: true };
  }
  return { effectiveRole: relationRole, subordinatePooled: false };
}

export function shouldHideSubordinateDimension(
  subordinateCount: number,
): boolean {
  return subordinateCount < SUBORDINATE_POOL_THRESHOLD;
}

export function groupBallotsWithPooling(ballots: BallotLike[]): {
  subordinatePooled: boolean;
  subordinateCount: number;
  byRole: Record<string, number[]>;
} {
  const subordinateCount = ballots.filter(
    (b) => b.relationRole === "SUBORDINATE",
  ).length;
  const subordinatePooled = shouldHideSubordinateDimension(subordinateCount);
  const byRole: Record<string, number[]> = {};

  for (const b of ballots) {
    const { effectiveRole } = resolveRoleForWeighting(
      b.relationRole,
      subordinateCount,
    );
    if (!byRole[effectiveRole]) byRole[effectiveRole] = [];
    byRole[effectiveRole].push(b.calibratedScore);
  }

  return { subordinatePooled, subordinateCount, byRole };
}
