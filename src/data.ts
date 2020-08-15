import * as yaml from 'yaml';
import UserError from './errors/user-error';
import {extname} from 'path';
import {getCwd, readFile} from './utils/file-utils';
import {logger} from './docmaker';

const defaultData = {
  break: `<div style="page-break-after: always"></div>`,
};

const loadJsDataFile = async (file: string): Promise<any> => {
  const val = await import(file);
  switch (typeof val) {
    case 'object':
      return val;
    case 'function':
      return val(); // We should be able to always await a function
    default:
      throw new UserError('JavaScript data file should export an object or function');
  }
};

const loadDataFile = async (file: string): Promise<any> => {
  const fileExt = extname(file);

  switch (fileExt) {
    case '.js':
      return loadJsDataFile(file);
    case '.yaml':
    case '.yml':
      const data = await readFile(file);
      return yaml.parse(data.toString());
    default:
      logger.warn(`Unknown data file extension: ${fileExt}`);
  }
};

/**
 * Load all data files from the given directory.
 *
 * @param dir     base directory to load data files from
 * @param files   that should be parsed into the data object
 */
const processDataFiles = async (dir: string, files: string[]): Promise<Object> => {
  const previous = getCwd();
  process.chdir(dir);
  let data = {...defaultData};
  for (const file of files) {
    const fileData = await loadDataFile(file);
    data = {...data, ...fileData};
  }
  process.chdir(previous);
  return data;
};

export {processDataFiles};
