import {
  getOptionalSessionUser,
  jsonPrivate,
  resolveSessionUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Current signed-in Cursor viewer only — never accepts a client-supplied user id. */
export async function GET(request: Request) {
  const user = await getOptionalSessionUser(request);
  return jsonPrivate({
    code: 200,
    data: {
      user,
      authMode: "cursor_identity",
      note: user?.simulated
        ? "本地开发为模拟身份，发布后以 Cursor 登录为准"
        : undefined,
    },
  });
}

/** Handshake: verify Cursor identity and upsert the app user. No body userId. */
export async function POST(request: Request) {
  const user = await resolveSessionUser(request);
  if (user instanceof Response) return user;
  return jsonPrivate({ code: 200, data: { user } });
}
