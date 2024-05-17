import * as fs from "fs";
import * as path from "path";

interface CruftJson {
  template: string;
  commit: string;
  context: {
    nunjucks: {
      [key: string]: string;
      _template: string;
    };
  };
  directory: string;
  checkout?: string | null | undefined;
}

export function parseCruftJson(projectDir: string): CruftJson {
  const cruftFilePath = path.join(projectDir, ".cruft.json");
  if (!fs.existsSync(cruftFilePath)) {
    throw new Error("No .cruft.json file found!");
  }

  const cruftState = JSON.parse(fs.readFileSync(cruftFilePath, "utf8"));

  if (
    typeof cruftState.template !== "string" ||
    typeof cruftState.commit !== "string" ||
    typeof cruftState.context !== "object" ||
    typeof cruftState.context.nunjucks !== "object" ||
    typeof cruftState.context.nunjucks._template !== "string" ||
    typeof cruftState.directory !== "string" ||
    (cruftState.checkout !== null && typeof cruftState.checkout !== "string")
  ) {
    throw new Error("Invalid .cruft.json schema");
  }

  return cruftState;
}

export function generateCruftJson(
  projectDir: string,
  cruftJson: CruftJson
): void {
  const cruftFilePath = path.join(projectDir, ".cruft.json");
  fs.writeFileSync(cruftFilePath, JSON.stringify(cruftJson, null, 2));
}
