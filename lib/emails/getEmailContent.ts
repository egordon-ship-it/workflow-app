import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import type { EmailContent } from "./types";

const CONTENT_DIR = join(process.cwd(), "lib", "emails", "content");

let keyIndex: Map<string, string> | null = null;

function getKeyIndex(): Map<string, string> {
  if (keyIndex) return keyIndex;
  const map = new Map<string, string>();
  try {
    for (const file of readdirSync(CONTENT_DIR)) {
      if (!file.endsWith(".json")) continue;
      const stem = file.slice(0, -".json".length);
      map.set(stem.toLowerCase(), stem);
    }
  } catch {
    /* empty */
  }
  keyIndex = map;
  return map;
}

export function getEmailContent(key: string): EmailContent | null {
  const index = getKeyIndex();
  const stem = index.get(key.toLowerCase());
  if (!stem) return null;
  const file = join(CONTENT_DIR, `${stem}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as EmailContent;
  } catch {
    return null;
  }
}

export function listEmailContentKeys(): string[] {
  return Array.from(getKeyIndex().values()).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function hasEmailContent(key: string): boolean {
  return getKeyIndex().has(key.toLowerCase());
}
