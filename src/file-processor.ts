import {readFile} from './utils/file-utils';

export default class FileProcessor {

  /**
   * Take a list of strings and join the file contents of their files.
   *
   * @param files to join the contents of
   */
  public async joinFiles(files: string[]): Promise<string> {
    let result = '';
    for (const value of files) {
      let content = (await readFile(value)).toString();
      result += content;
    }
    return result;
  }
}
