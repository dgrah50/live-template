import nunjucks from "nunjucks";
import path from "path";
import fs from "fs";
import chardet from "chardet";
import iconv from "iconv-lite";

class TemplatingEngine {
  private env: nunjucks.Environment;
  private supportedExtensions: string[];

  constructor() {
    this.env = new nunjucks.Environment(new nunjucks.FileSystemLoader(), {
      autoescape: true,
      tags: {
        blockStart: "//[%",
        blockEnd: "%]",
        variableStart: "<@@",
        variableEnd: "@@>",
        commentStart: "[#",
        commentEnd: "#]",
      },
    });

    this.supportedExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]; // List of supported JS-related extensions
  }

  render(template: string, context: object): string {
    return this.env.renderString(template, context);
  }

  renderFile(templatePath: string, context: object): string {
    const extension = path.extname(templatePath);
    const fileBuffer = fs.readFileSync(templatePath);
    const encoding = chardet.detect(fileBuffer) || "utf-8";
    const fileContent = iconv.decode(fileBuffer, encoding);

    if (encoding === "utf-8" || encoding === "ISO-8859-1") {
      return this.render(fileContent, context);
    } else {
      return fileContent;
    }
  }
}

export const templatingEngine = new TemplatingEngine();
