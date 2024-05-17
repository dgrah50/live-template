import { execSync } from "child_process";

export function getVersion(): string {
  try {
    const version = execSync("npm view . version").toString().trim();
    return version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
