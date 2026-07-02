import fs from "node:fs";
import path from "node:path";

export function parseDotEnv(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((values, line) => {
      const separator = line.indexOf("=");
      if (separator === -1) {
        return values;
      }

      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");

      if (key) {
        values[key] = value;
      }

      return values;
    }, {});
}

export function loadDotEnv({ env = process.env, filePath = path.join(process.cwd(), ".env") } = {}) {
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  const values = parseDotEnv(fs.readFileSync(filePath, "utf8"));
  let loaded = 0;

  for (const [key, value] of Object.entries(values)) {
    if (env[key] === undefined) {
      env[key] = value;
      loaded += 1;
    }
  }

  return loaded;
}
