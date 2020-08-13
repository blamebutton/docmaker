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
      Config.resolveProjectFiles(dir, config.assets)
    ]);

    return config;
  }

  private static async resolveProjectFiles(projectDir: string, relativePaths: Array<string>): Promise<Array<string>> {
    const paths: string[] = [];

    for (const path of relativePaths) {
      try {
        const filePath = await Config.resolveProjectFile(projectDir, path);
        paths.push(filePath);
      } catch (e) {
        if (e instanceof ProjectFileNotFoundError) {
          logger.warn(e.message); // Log warning to console
        }
      }
    }

    return paths;
  }

  private static async resolveProjectFile(dir: string, relativePath: string): Promise<string> {
    const filePath = path.join(dir, relativePath);
    const exists: boolean = await findUp.exists(filePath);

    if (!exists) {
      throw new ProjectFileNotFoundError(filePath);
    }

    return filePath;
  }

  private static async resolvePages(dir: string, globs: Array<string>): Promise<Array<string>> {
    // Glob & sort all pages in parallel
    const results = await Promise.all(
      globs.map(async file => {
        // Match glob with project directory as cwd, retrieve absolute paths
        const files = await glob(file, {cwd: dir, absolute: true});
        // fast-glob makes no guarantees about sorting, so we'll sort the files per-glob here.
        return files.sort();
      })
    );

    const paths: string[] = [];

    results.forEach((result, index) => {
      // Glob returned no results, give warning
      if (result.length == 0) {
        logger.warn(`Page glob "${globs[index]}" did not match any files.`);
      }
      paths.push(...result); // Flatten results
    });

    return paths;
  }

  /**
   * Merge a config onto the object.
   * @param config to merge
   */
  protected merge(config: Config) {
    const setter = ([key, value]) => {
      if (!value) return;
      this[key] = value;
    }
    Object.entries(config).forEach(setter);
    return this;
  }
}

export async function findProjectDirectory(): Promise<string> {
  // Walk up the directory tree
  const projectDirectory = await findUp(
    async directory => {
      // Check if the config file exists in this directory
      const configFile = path.join(directory, CONFIG_FILE_NAME);
      const hasConfigFile = await findUp.exists(configFile);
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
