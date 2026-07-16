/**
 * Verify a Cloudflare Turnstile token.
 * In development, skips verification when keys are not configured.
 */
export async function verifyCaptcha(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "CAPTCHA non configuré" };
    }
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, error: "CAPTCHA requis" };
  }

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (ip && ip !== "unknown") body.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!data.success) {
    return { success: false, error: "CAPTCHA invalide" };
  }
  return { success: true };
}
