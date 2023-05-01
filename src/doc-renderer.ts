import FileRenderer from './renderer/file-renderer.js';
import {MarkdownRenderer} from './renderer/markdown-renderer.js';
import {LiquidRenderer} from './renderer/liquid-renderer.js';

export class DocRenderer {

  private readonly data: Object;
  private markdown: FileRenderer;
  private liquid: FileRenderer;

  /**
   * Constructor that takes the data
   * @param data
   */
  constructor(data: Object) {
    this.data = data;
    this.markdown = new MarkdownRenderer();
    this.liquid = new LiquidRenderer();
  }

  public async renderLiquidFile(path: string, data: Object = {}): Promise<string> {
    return this.liquid.renderFile(path, {...this.data, ...data});
  }

  public async renderLiquidTemplate(content: string, data: Object = {}): Promise<string> {
    return this.liquid.render(content, {...this.data, ...data});
  }

  public async renderPage(content: string, data: Object = {}): Promise<string> {
    const contents = await this.renderLiquidTemplate(content, {...this.data, ...data});
    return this.markdown.render(contents, {});
  }
}
