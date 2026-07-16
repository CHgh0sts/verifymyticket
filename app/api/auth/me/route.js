import { getSession } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonOk({ authenticated: false, user: null });
  }
  return jsonOk({
    authenticated: true,
    user: {
      userId: session.userId,
      username: session.username,
      email: session.email,
    },
  });
}
