import crypto from "crypto";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config/config.json");

export function generateApiKey(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function createConfigFile(apiKey: string) {
  const config = {
    apiKey,
    authEnabled: true,
  };

  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ API key written to ${CONFIG_PATH}`);
}

// CLI handler
if (process.argv.includes("--generate-key")) {
  const key = generateApiKey();
  console.log(`🔑 Generated API Key:\n\n${key}\n`);
  createConfigFile(key);
  process.exit(0);
}
