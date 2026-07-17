import { TOTP, Secret } from "otpauth";

const ISSUER = "VerifyMyTicket";

export function generateTotpSecret() {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

export function buildTotp(secretBase32, email) {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export function getTotpUri(secretBase32, email) {
  return buildTotp(secretBase32, email).toString();
}

export function verifyTotpCode(secretBase32, token) {
  if (!secretBase32 || !token) return false;
  const totp = buildTotp(secretBase32, "user");
  const delta = totp.validate({ token: String(token).replace(/\s/g, ""), window: 1 });
  return delta !== null;
}
