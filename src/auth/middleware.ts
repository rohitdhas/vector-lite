import crypto from "crypto";
import fs from "fs";
import path from "path";

const CONFIG_PATH =
  process.env.CONFIG_PATH || path.join(process.cwd(), "config/config.json");

let apiKey: string | undefined = process.env.VECTOR_LITE_API_KEY;
let enabled = process.env.ENABLE_AUTH === "true";

function generateApiKey(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

// If config not present, auto-create one
if (!fs.existsSync(CONFIG_PATH)) {
  const generatedKey = apiKey || generateApiKey();
  const config = { apiKey: generatedKey, authEnabled: true };

  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ New API key generated: ${generatedKey}`);
  apiKey = generatedKey;
  enabled = true;
} else {
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
