import * as findUp from 'find-up';
import * as yaml from 'yaml';
import * as path from 'path';
import * as glob from 'fast-glob';
import ProjectFileNotFoundError from './errors/project-file-not-found-error';
import {getCwd, readFile} from './utils/file-utils';
import ConfigValidationError from './errors/config-validation-error';
import {IsNotEmpty, IsString, validate} from 'class-validator';
import MissingConfigError from './errors/missing-config-error';
import {logger} from './docmaker';

const CONFIG_FILE_NAME = 'docmaker.yaml';

type FileFilterCallback = (files: string[], index: number) => boolean | void;

/**
 * The configuration for Docmaker
 */
export class Config {

  @IsNotEmpty()
  @IsString()
  public layout!: string;

  @IsNotEmpty()
  @IsString()
  public buildDir: string = 'build';

  @IsNotEmpty({each: true})
  @IsString({each: true})
  public pages: string[] = [];

  @IsNotEmpty({each: true})
  @IsString({each: true})
  public data: string[] = [];

  @IsNotEmpty({each: true})
  @IsString({each: true})
  public assets: string[] = [];

  public static async fromDirectory(dir: string): Promise<Config> {
    const configPath = path.join(dir, CONFIG_FILE_NAME);
    const content = (await readFile(configPath)).toString();
    // Load yaml config, use "Config" instead of "any"
    const parsedConfig: Config = yaml.parse(content);
    let config: Config = new Config().merge(parsedConfig);

    // Validate config
    const result = await validate(config);

    if (result.length > 0) {
      throw new ConfigValidationError(result);
    }

    // Resolve all project files
    [config.layout, config.pages, config.data, config.assets] = await Promise.all([
      // Resolve the layout template
      Config.resolveProjectFile(dir, config.layout),
      // Resolve the globs for the pages
      Config.resolvePages(dir, config.pages),
      // Resolve the relative paths to the data files
      Config.resolveProjectFiles(dir, config.data),
      // Resolve the relative paths to the asset files
      Config.resolveFiles(dir, config.assets)
    ]);

    return config;
  }

  /**
   * Resolve a list of files based on the given directory and globs.
   *
   * @param dir base directory to search inside
   * @param globs the globs to match against
   * @param callback optional callback for filtering the input files
   * @returns Promise<string[]> a list of file paths which matched the glob
   */
  private static async resolveFiles(dir: string, globs: string[], callback: FileFilterCallback = () => true): Promise<string[]> {
    // Map all globs to the
    const results = await Promise.all(globs.map(async file => {
      const files = await glob(file, {cwd: dir, absolute: true});
      return files.sort();
    }));
    const paths = [];
    results.forEach((value, index) => {
      // An optional callback parameter can be supplied. Return null to skip these matched files.
      if (callback !== null && callback(value, index) === false) return;
      paths.push(...value);
    });
    return paths;
  }

  /**
   * Resolve the project files using the "findUp" library.

   * @param dir directory to start searching in
   * @param relativePaths of the files
   * @returns Promise<string[]> a list of file paths found using "findUp"
   */
  private static async resolveProjectFiles(dir: string, relativePaths: string[]): Promise<string[]> {
    const paths: string[] = [];

    for (const path of relativePaths) {
      try {
        const filePath = await Config.resolveProjectFile(dir, path);
        paths.push(filePath);
      } catch (e) {
        if (e instanceof ProjectFileNotFoundError) {
          logger.warn(e.message); // Log warning to console
        }
      }
    }

    return paths;
  }

  /**
   * Resolve a file using the "findUp" library.
   *
   * @param dir directory to start the search in
   * @param relativePath of the file, this will be passed to "findUp"
   * @returns Promise<string> string absolute path to the file
   */
  private static async resolveProjectFile(dir: string, relativePath: string): Promise<string> {
    const filePath = path.join(dir, relativePath);
    const exists: boolean = await findUp.pathExists(filePath);

    if (!exists) {
      throw new ProjectFileNotFoundError(filePath);
    }

    return filePath;
  }

  /**
   * Same as "resolveFiles", except this prints a warning when no matches were found for a glob.
   *
   * @param dir base directory to search inside
   * @param globs the globs to match against
   * @returns Promise<string[]> a list of file paths which matched the glob
   */
  private static async resolvePages(dir: string, globs: string[]): Promise<string[]> {
    return this.resolveFiles(dir, globs, (files, index) => {
      if (files.length == 0) {
        logger.warn(`Page glob "${globs[index]}" did not match any files.`);
      }
    });
  }

  /**
   * Merge a config onto the object.
   * @param config to merge
   */
  protected merge(config: Config): this {
    const setter = ([key, value]) => {
      if (!value) return;
      this[key] = value;
    };
    Object.entries(config).forEach(setter);
    return this;
  }
}

/**
 * Use "findUp" to find the directory which houses the "docmaker.yaml".
 */
export async function findProjectDirectory(): Promise<string> {
  // Walk up the directory tree
  const projectDirectory = await findUp.findUp(
    async directory => {
      // Check if the config file exists in this directory
      const configFile = path.join(directory, CONFIG_FILE_NAME);
      const hasConfigFile = await findUp.pathExists(configFile);
      if (hasConfigFile) {
        return directory;
      }
      return null;
    },
    // Find directory & start in custom CWD
    {type: 'directory', cwd: getCwd()}
  );

  // Find-up was not able to find a directory with a config file
  if (!projectDirectory === null) {
    throw new MissingConfigError();
  }

  return projectDirectory;
}
