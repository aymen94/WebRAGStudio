import { db } from "../db";

export function getStoredSetting(key: string) {
  return (
    db.prepare("SELECT value FROM settings WHERE key=?").get(key) as
      { value: string } | undefined
  )?.value;
}

export function saveSettings(entries: Record<string, string>) {
  const put = db.prepare(
    "INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  );
  db.exec("BEGIN");
  try {
    for (const [key, val] of Object.entries(entries)) put.run(key, val);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
