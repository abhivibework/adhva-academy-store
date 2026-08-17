import crypto from "crypto";

export function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function hmacSha256Hex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function hmacSha256Base64(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}
