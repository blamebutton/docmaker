/**
 * Interface for any renderer that can read from files.
 */
export default interface FileRenderer {

  /**
   * Render a file from a filesystem to include the data given.
   *
   * @param path to the file to render
   * @param data to use for templating
   */
  renderFile(path: string, data: Object)

  /**
   * Render a string to include the data given.
   * @param content to parse through renderer
   * @param data to use for templating
   */
  render(content: string, data: Object);
}

