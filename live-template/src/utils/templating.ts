import nunjucks from "nunjucks";
import path from "path";
import fs from "fs";
import chardet from "chardet";
import iconv from "iconv-lite";
import type { SimpleGit } from "simple-git";

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

  renderTemplateFromString(template: string, context: object): string {
    return this.env.renderString(template, context);
  }

  renderTemplateFromFile(templatePath: string, context: object): string {
    const fileBuffer = fs.readFileSync(templatePath);
    const encoding = chardet.detect(fileBuffer) || "utf-8";
    const fileContent = iconv.decode(fileBuffer, encoding);

    if (encoding === "utf-8" || encoding === "ISO-8859-1") {
      return this.renderTemplateFromString(fileContent, context);
    } else {
      return fileContent;
    }
  }

  renderGitTemplateDirToNewOutputDir(
    inputDir: string,
    outputDir: string,
    context: object
  ) {
    // Generate project files
    const templateFiles = fs
      .readdirSync(inputDir || ".", {
        withFileTypes: true,
      })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);

    for (const file of templateFiles) {
      const filePath = path.join(inputDir || ".", file);

      const renderedContent = templatingEngine.renderTemplateFromFile(
        filePath,
        context
      );

      const outputFilePath = path.join(outputDir, file);
      fs.writeFileSync(outputFilePath, renderedContent);
    }
  }
}

export const templatingEngine = new TemplatingEngine();
