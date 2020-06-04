import FileRenderer from './file-renderer';
import * as MarkdownIt from 'markdown-it';
import {getLanguage} from 'highlight.js';
import * as tocPlugin from 'markdown-it-toc-done-right';
import * as anchorPlugin from 'markdown-it-anchor';
import * as umlPlugin from 'markdown-it-textual-uml';
import {readFile} from '../utils/file-utils';

export class MarkdownRenderer implements FileRenderer {

  private markdown: MarkdownIt;

  constructor() {
    this.markdown = new MarkdownIt({
      typographer: true,
      linkify: true,
      highlight: MarkdownRenderer.highlight,
      html: true,
    });
    // @ts-ignore
    this.markdown.use(anchorPlugin)
    this.markdown.use(tocPlugin, {level: 2});
    this.markdown.use(umlPlugin);
  }

  private static highlight(str: string, lang: string) {
    if (lang && getLanguage(lang)) {
      try {
        return MarkdownRenderer.highlight(lang, str).value;
      } catch (_) {
      }
      return ""; // use external default escaping
    }
    return null;
  }

  /**
   * Render the contents of a file.
   *
   * @param path to the file to render
   * @param data to use for templating
   * @return the rendered string
   */
  async renderFile(path: string, data: Object) {
    const content = (await readFile(path)).toString();
    return this.render(content, data);
  }

  /**
   * Render a template string with data.
   *
   * @param content to render
   * @param data to use for templating
   * @return the rendered string
   */
  async render(content: string, data: Object) {
    return this.markdown.render(content, {});
  }
}
