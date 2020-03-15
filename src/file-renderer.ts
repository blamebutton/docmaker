import * as MarkdownIt from "markdown-it";
import * as tocPlugin from "markdown-it-toc-done-right";
import * as anchorPlugin from "markdown-it-anchor";
import * as umlPlugin from "markdown-it-textual-uml";
import {getLanguage, highlight} from "highlight.js";
import TemplateEngine from "./template-engine";
import {readFile} from "./utils/file-utils";

export class FileRenderer {

  private readonly data: Object;
  private markdown: MarkdownIt;
  private templateEngine: TemplateEngine;

  /**
   * Constructor that takes
   * @param data
   */
  constructor(data: Object) {
    this.data = data;
    this.markdown = FileRenderer.buildMarkdownEngine();
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Build the markdown engine and include all plugins.
   */
  private static buildMarkdownEngine() {
    const markdown = new MarkdownIt({
      typographer: true,
      linkify: true,
      highlight: FileRenderer.highlight,
      html: true
    });
    // Register markdown-it plugins
    markdown.use(anchorPlugin);
    markdown.use(tocPlugin, {level: 2});
    markdown.use(umlPlugin);
    return markdown;
  }

  private static highlight(str: string, lang: string) {
    if (lang && getLanguage(lang)) {
      try {
        return highlight(lang, str).value;
      } catch (_) {
      }
      return ""; // use external default escaping
    }
    return null;
  }

  public async processFile(path: string, data: Object = {}): Promise<string> {
    let content = (await readFile(path)).toString();
    return this.process(content, data);
  }

  public async process(content: string, data: Object = {}): Promise<string> {
    return await this.templateEngine.render(content, {...this.data, ...data});
  }

  public async renderFile(path: string, data: Object = {}): Promise<string> {
    let content = (await readFile(path)).toString();
    return this.render(content, data);
  }

  public async render(content: string, data: Object = {}): Promise<string> {
    const contents = await this.process(content, data);
    return this.markdown.render(contents, {});
  }
}
