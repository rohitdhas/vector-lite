import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config/config.json");

let apiKey = process.env.VECTOR_LITE_API_KEY;
let enabled = process.env.ENABLE_AUTH === "true";

// Load from config file if exists
if (fs.existsSync(CONFIG_PATH)) {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  if (config.apiKey) apiKey = config.apiKey;
  if (typeof config.authEnabled === "boolean") enabled = config.authEnabled;
}

export function isAuthEnabled(): boolean {
  return enabled && Boolean(apiKey);
}

export function getStoredApiKey(): string | undefined {
  return apiKey;
}

export function authMiddleware(req: any, res: any, next: any) {
  if (!isAuthEnabled()) return next();

  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token || token !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
