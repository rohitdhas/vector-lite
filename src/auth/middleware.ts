export function isAuthEnabled(): boolean {
  return process.env.ENABLE_AUTH === "true";
}

export function getStoredApiKey(): string | undefined {
  return process.env.VECTOR_LITE_API_KEY;
}

export function authMiddleware(req: any, res: any, next: any) {
  if (!isAuthEnabled()) return next();

  const token = req.headers.authorization?.split("Bearer ")[1];
  const expectedToken = getStoredApiKey();

  if (!expectedToken) {
    console.error("❌ VECTOR_LITE_API_KEY not set but auth is enabled.");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
