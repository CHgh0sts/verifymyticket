import { jsonOk } from "@/lib/api";
import { isPushConfigured } from "@/lib/push";

export async function GET() {
  return jsonOk({
    configured: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
  });
}
