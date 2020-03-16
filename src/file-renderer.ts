import Renderer from "./renderer/renderer";
import {MarkdownRenderer} from "./renderer/markdown-renderer";
import {LiquidRenderer} from "./renderer/liquid-renderer";

export class FileRenderer implements Renderer {

  private readonly data: Object;
  private markdown: Renderer;
  private liquid: Renderer;

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

  public async renderFile(path: string, data: Object = {}): Promise<string> {
    return this.markdown.renderFile(path, {...this.data, ...data});
  }

  public async render(content: string, data: Object = {}): Promise<string> {
    const contents = await this.renderLiquidTemplate(content, {...this.data, ...data});
    return this.markdown.render(contents, {});
  }
}
