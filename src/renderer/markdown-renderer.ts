import FileRenderer from './file-renderer';
import * as MarkdownIt from 'markdown-it';
import {getLanguage, highlight} from 'highlight.js';
import * as tocPlugin from 'markdown-it-toc-done-right';
import * as anchorPlugin from 'markdown-it-anchor';
import * as umlPlugin from 'markdown-it-textual-uml';
import {readFile} from '../utils/file-utils';

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
  }

  private highlight(str: string, lang: string) {
    let code = '';
    
    if (lang && getLanguage(lang)) {
      code = highlight(lang, str, true).value;
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
