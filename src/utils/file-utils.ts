import {promisify} from 'util';
import * as fs from 'fs';

/**
 * Read the contents of a file, returns a promise.
 */
export const readFile = promisify(fs.readFile);

/**
 * Write the contents of a file, returns a promise.
 */
export const writeFile = promisify(fs.writeFile);

/**
 * Copy a file from source to destination.
 */
export const copyFile = promisify(fs.copyFile);

/**
 * Make a directory in the filesystem.
 */
export const mkdir = promisify(fs.mkdir);

/**
 * Take a list of strings and join the file contents of their files.
 *
 * @param files to join the contents of
 */
export const joinFiles = async (files: string[]): Promise<string> => {
  let result = '';
  for (const value of files) {
    let content = (await readFile(value)).toString();
    result += content;
    result += '\n';
  }
  return result;
}
