import {promisify} from "util";
import * as fs from "fs";

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

export const mkdir = promisify(fs.mkdir);
