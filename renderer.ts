import * as fs from "fs";
import { promisify } from "util";
import { extname } from "path";
import * as MarkdownIt from "markdown-it";
import * as tocPlugin from "markdown-it-toc-done-right";
import * as anchorPlugin from "markdown-it-anchor";
import * as umlPlugin from "markdown-it-textual-uml";
import { getLanguage, highlight } from "highlight.js";
import { Liquid } from "liquidjs";

const readFile = promisify(fs.readFile);

class FileRenderer {
  private data: Object;
  private markdown: MarkdownIt;
  private liquid: Liquid;

  constructor(data: Object) {
    this.data = data;

    this.markdown = new MarkdownIt({
      typographer: true,
      linkify: true,
      highlight: this.highlight,
      html: true
    });

    // Register markdown-it plugins
    this.markdown.use(tocPlugin, { level: 2 });
    this.markdown.use(anchorPlugin);
    this.markdown.use(umlPlugin);

    this.liquid = new Liquid();
  }

  public async processString(content: string, data: Object): Promise<string> {
    return await this.liquid.parseAndRender(content, data);
  }

  public async renderFile(path: string, data: Object = {}): Promise<string> {
    const extension = extname(path);
    const rawContents = await readFile(path);
    const contents = await this.processString(rawContents.toString(), {
      ...this.data,
      ...data
    });

    if (extension == ".md") {
      return this.markdown.render(contents, {});
    }

    return contents;
  }

  private highlight(str: string, lang: string) {
    if (lang && getLanguage(lang)) {
      try {
        return highlight(lang, str).value;
      } catch (_) {}
    }

    return ""; // use external default escaping
  }
}

export { FileRenderer };
