import {promisify} from 'util';
import * as fs from 'fs';
import {cwd as getProcessCwd, env} from 'process';

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
export async function joinFiles(files: string[]): Promise<string> {
  let result = '';
  for (const value of files) {
    let content = (await readFile(value)).toString();
    result += content;
    result += '\n';
  }
  return result;
}


export function getCwd(): string {
  // Use original CWD when ran from an NPM script
  if (env.INIT_CWD !== undefined) {
    return env.INIT_CWD;
  }

  // Return current CWD when ran standalone
  return getProcessCwd();
}
