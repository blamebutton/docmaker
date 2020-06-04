import * as findUp from 'find-up';
import * as yaml from 'yaml';
import * as path from 'path';
import * as glob from 'fast-glob';
import * as signale from 'signale';
import * as jf from 'joiful';
import {cwd as getProcessCwd, env} from 'process';
import ProjectFileError from './errors/project-file-error';
import {readFile} from './utils/file-utils';
import ValidationError from './errors/validation-error';

const CONFIG_FILE_NAME = 'docmaker.yaml';

/**
 * The configuration for Docmaker
 */
export class Config {

  @jf.string().required()
  public layout!: string;

  @jf.string().default('build')
  public buildDir!: string;

  @jf.array().default([]).items(t => t.string())
  public pages!: string[];

  @jf.array().default([]).items(t => t.string())
  public data!: string[];

  @jf.array().default([]).items(t => t.string())
  public assets!: string[];

  public static async fromDirectory(projectDir: string): Promise<Config> {
    const configPath = path.join(projectDir, CONFIG_FILE_NAME);
    const content = await readFile(configPath);
    // Load yaml config, use "Config" instead of "any"
    const parsedConfig: Config = yaml.parse(content.toString());
    let config: Config = new Config();
    // TODO: maybe automatically transfer values?
    config.merge(parsedConfig);

    // Validate config
    const validationResult = jf.validate(config);

    // FIXME: wrap in better error
    if (validationResult.error) {
      throw new ValidationError(validationResult.error);
    }
    // Override config with validated variant which has defaults applied
    config = validationResult.value;

    // Resolve all project files
    [config.layout, config.pages, config.data, config.assets] = await Promise.all([
      // Resolve the layout template
      Config.resolveProjectFile(projectDir, config.layout),
      // Resolve the globs for the pages
      Config.resolvePages(projectDir, config.pages),
      // Resolve the relative paths to the data files
      Config.resolveProjectFiles(projectDir, config.data),
      // Resolve the relative paths to the asset files
      Config.resolveProjectFiles(projectDir, config.assets)
    ]);
    return config;
  }

  private static async resolveProjectFiles(
    projectDir: string,
    relativePaths: Array<string>
  ): Promise<Array<string>> {
    const paths = [];

    for (const relativePath of relativePaths) {
      try {
        const filePath = await Config.resolveProjectFile(projectDir, relativePath);
        paths.push(filePath);
      } catch (e) {
        if (e instanceof ProjectFileError) {
          // Log warning to console
          signale.warn(e.message);
        }
      }
    }

    return paths;
  }

  private static async resolveProjectFile(
    projectDir: string,
    relativePath: string
  ): Promise<string> {
    const filePath = path.join(projectDir, relativePath);

    const exists = await findUp.exists(filePath);

    if (!exists) {
      throw new ProjectFileError(
        `Could not find project file with path ${filePath}`
      );
    }

    return filePath;
  }

  private static async resolvePages(
    dir: string,
    pageGlobs: Array<string>
  ): Promise<Array<string>> {
    // Glob & sort all pages in parallel
    const results = await Promise.all(
      pageGlobs.map(async file => {
        // Match glob with project directory as cwd, retrieve absolute paths
        const files = await glob(file, {cwd: dir, absolute: true});

        // fast-glob makes no guarantees about sorting, so we'll sort the files per-glob here.
        return files.sort();
      })
    );

    let paths: string[] = [];

    results.forEach((result, index) => {
      // Glob returned no results, give warning
      if (result.length == 0) {
        signale.warn(
          `Page glob "${pageGlobs[index]}" did not match any files.`
        );
      }

      // Flatten results
      paths.push(...result);
    });

    // Flatten results
    return paths;
  }

  /**
   * Merge a config onto the object.
   * @param config to merge
   */
  protected merge(config: Config) {
    const setter = ([key, value]) => this[key] = value;
    Object.entries(config).forEach(setter);
  }
}

function getCwd(): string {
  // Use original CWD when ran from an NPM script
  if (env.INIT_CWD !== undefined) {
    return env.INIT_CWD;
  }

  // Return current CWD when ran standalone
  return getProcessCwd();
}

export async function findProjectDirectory(): Promise<string> {
  // Walk up the directory tree
  const projectDirectory = await findUp(
    async directory => {
      // Check if the config file exists in this directory
      const hasConfigFile = await findUp.exists(
        path.join(directory, CONFIG_FILE_NAME)
      );

      if (hasConfigFile) {
        return directory;
      }
      return undefined;
    },
    // find directory & start in custom CWD
    {type: 'directory', cwd: getCwd()}
  );

  // Find-up was not able to find a directory with a config file
  if (projectDirectory === undefined) {
    throw new ProjectFileError('Could not find config file.');
  }

  return projectDirectory;
}
