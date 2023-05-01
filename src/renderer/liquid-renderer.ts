import FileRenderer from './file-renderer.js';
import {Liquid} from 'liquidjs';
import {readFile} from '../utils/file-utils.js';

export class LiquidRenderer implements FileRenderer {

  private liquid: Liquid;

  constructor() {
    this.liquid = new Liquid();
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
    return this.liquid.parseAndRender(content, data);
  }
}
