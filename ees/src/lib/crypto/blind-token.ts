import { createHmac } from "crypto";

/**
 * 评价人盲化令牌：HMAC-SHA256(cycle_id + evaluator_user_id + secret_salt)
 * 仅用于防重复提交，不可反向关联身份。
 */
export function makeBlindToken(
  cycleId: string,
  evaluatorUserId: string,
  secretSalt: string,
): string {
  return createHmac("sha256", secretSalt)
    .update(`${cycleId}${evaluatorUserId}${secretSalt}`)
    .digest("hex");
}
