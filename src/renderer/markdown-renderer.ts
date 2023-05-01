import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import anchorPlugin from 'markdown-it-anchor';
import footnotePlugin from 'markdown-it-footnote';
import umlPlugin from 'markdown-it-textual-uml';
import tocPlugin from 'markdown-it-toc-done-right';
import {readFile} from '../utils/file-utils.js';
import FileRenderer from './file-renderer.js';

export class MarkdownRenderer implements FileRenderer {

  private markdown: MarkdownIt;

  constructor() {
    this.markdown = new MarkdownIt({
      typographer: true,
      highlight: (str, lang) => this.highlight(str, lang),
      linkify: true,
      html: true,
    });
    // @ts-ignore
    this.markdown.use(anchorPlugin);
    this.markdown.use(tocPlugin, {level: 2});
    this.markdown.use(umlPlugin);
    this.markdown.use(footnotePlugin);
  }

  private highlight(str: string, lang: string) {
    let code: string;

    if (lang && hljs.getLanguage(lang)) {
      code = hljs.highlight(lang, str, true).value;
    } else {
      code = this.markdown.utils.escapeHtml(str);
    }

    return `<pre class="hljs"><code>${code}</code></pre>`;
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
