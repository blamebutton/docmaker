import {Liquid} from "liquidjs";
import {readFile} from "./utils/file-utils";

export default class TemplateEngine {

  private liquid: Liquid;

  constructor() {
    this.liquid = new Liquid();
  }

  /**
   * Render a template string with data.
   *
   * @param content to render
   * @param data to use for templating
   * @return the rendered string
   */
  public async render(content: string, data: Object = {}): Promise<string> {
    return this.liquid.parseAndRender(content, data);
  }

  /**
   * Render the contents of a file.
   *
   * @param path to the file to render
   * @param data to use for templating
   * @return the rendered string
   */
  public async renderFile(path: string, data: Object = {}): Promise<string> {
    return this.render((await readFile(path)).toString(), data);
  }
}
