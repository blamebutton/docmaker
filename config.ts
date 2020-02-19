import * as findUp from "find-up";
import * as fs from "fs";
import * as yaml from "yaml";
import { promisify } from "util";
import * as path from "path";
import * as glob from "fast-glob";
import * as signale from "signale";
import { env, cwd as getProcessCwd } from "process";
import { ProjectFileException } from "./errors";

const readFile = promisify(fs.readFile);

const CONFIG_FILE_NAME = "docmaker.yaml";

export interface Config {
  layout: string;
  pages: Array<string>;
  data: Array<string>;
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
      return hasConfigFile && directory;
    },
    // find directory & start in custom CWD
    { type: "directory", cwd: getCwd() }
  );

  // Find-up was not able to find a directory with a config file
  if (projectDirectory === undefined) {
    throw new ProjectFileException("Could not find config file.");
  }

  return projectDirectory;
}

export async function loadConfig(projectDir: string): Promise<Config> {
  // Load project config file
  const configPath = path.join(projectDir, CONFIG_FILE_NAME);
  const content = await readFile(configPath);

  // Parse the project config
  const config: Config = yaml.parse(content.toString());

  [config.layout, config.pages, config.data] = await Promise.all([
    // Resolve the layout template
    resolveProjectFile(projectDir, config.layout),
    // Resolve the globs for the pages
    resolvePages(projectDir, config.pages),
    // Resolve the relative paths to the data files
    resolveProjectFiles(projectDir, config.data)
  ]);

  return config;
}

async function resolvePages(
  dir: string,
  pageGlobs: Array<string>
): Promise<Array<string>> {
  // Glob & sort all pages in parallell
  const results = await Promise.all(
    pageGlobs.map(async file => {
      // Match glob with project directory as cwd, retrieve absolute paths
      const files = await glob(file, { cwd: dir, absolute: true });

      // fast-glob makes no guarantees about sorting, so we'll sort the files per-glob here.
      return files.sort();
    })
  );

  let paths = [];

  results.forEach((result, index) => {
    // Glob returned no results, give warning
    if (result.length == 0) {
      signale.warn(`Page glob "${pageGlobs[index]}" did not match any files.`);
    }

    // Flatten results
    paths.push(...result);
  });

  // Flatten results
  return paths;
}

async function resolveProjectFiles(
  projectDir: string,
  relativePaths: Array<string>
): Promise<Array<string>> {
  const paths = [];

  for (const relativePath of relativePaths) {
    try {
      const filePath = await resolveProjectFile(projectDir, relativePath);
      paths.push(filePath);
    } catch (e) {
      if (e instanceof ProjectFileException) {
        // Log warning to console
        signale.warn(e.message);
      }
    }
  }

  return paths;
}

async function resolveProjectFile(
  projectDir: string,
  relativePath: string
): Promise<string> {
  const filePath = path.join(projectDir, relativePath);

  const exists = await findUp.exists(filePath);

  if (!exists) {
    throw new ProjectFileException(
      `Could not find project file with path ${filePath}`
    );
  }

  return filePath;
}
