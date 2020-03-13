import * as fs from "fs";
import * as yaml from "yaml";
import { promisify } from "util";
import { UserError } from "./errors";
import * as signale from "signale";
import { extname } from "path";
const readFile = promisify(fs.readFile);

const loadJsDataFile = async (file: string): Promise<any> => {
  const val = await import(file);
  switch (typeof val) {
    case "object":
      return await Promise.resolve(val);
    case "function":
      return await val(); // We should be able to always await a function
    default:
      throw new UserError(
        "JavaScript data file should export an object or function"
      );
  }
};

const loadDataFile = async (file: string): Promise<any> => {
  const fileExt = extname(file);

  switch (fileExt) {
    case ".js":
      return loadJsDataFile(file);
    case ".yaml":
    case ".yml":
      const data = await readFile(file);
      return yaml.parse(data.toString());
    default:
      signale.warn(`Unknown data file extension: ${fileExt}`);
  }
};

const loadData = async (dataFiles: string[]): Promise<Object> => {
  let data = {};
  for (const file of dataFiles) {
    const dataFileData = await loadDataFile(file);
    data = {
      ...data,
      ...dataFileData
    };
  }

  return data;
};

export { loadData };
