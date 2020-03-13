import * as fs from "fs";
import { promisify } from "util";
import { findProjectDirectory, Config } from "./config";
import { extname, join as pathJoin, basename } from "path";
import * as signale from "signale";
import { UserError } from "./errors";
import * as findUp from "find-up";
import { FileRenderer } from "./renderer";
import { loadData } from "./data";

const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const makeDir = promisify(fs.mkdir);

const hardcodedData = {
  pagebreak: `<div style="page-break-after: always"></div>`
};

const getBuildDir = async (
  projectDir: string,
  buildDirName: string
): Promise<string> => {
  const buildDir = pathJoin(projectDir, buildDirName);

  const exists = await findUp.exists(buildDir);

  // Create build directory if it does not yet exist
  if (!exists) {
    makeDir(buildDir);
  }

  return buildDir;
};

const processAssets = async (
  renderer: FileRenderer,
  buildDir: string,
  assets: string[]
) => {
  for (const assetPath of assets) {
    const assetBaseName = basename(assetPath);
    const assetDistPath = pathJoin(buildDir, assetBaseName);

    const fileExt = extname(assetBaseName);

    switch (fileExt) {
      case ".css":
        const renderedAsset = await renderer.renderFile(assetPath);
        await writeFile(assetDistPath, renderedAsset);
        break;
      default:
        await copyFile(assetPath, assetDistPath, fs.constants.COPYFILE_EXCL);
    }
  }
};

const writeDocument = async (
  renderer: FileRenderer,
  buildDir: string,
  layout: string,
  content: string
) => {
  // Render layout with data & content
  const document = await renderer.renderFile(layout, {
    content: content
  });

  const filePath = pathJoin(buildDir, "index.html");

  await writeFile(filePath, document);
};

const run = async () => {
  const projectDir = await findProjectDirectory();
  const config = await Config.fromDirectory(projectDir);

  // Load all data
  const data = {
    ...hardcodedData,
    ...(await loadData(config.data))
  };

  const renderer = new FileRenderer(data);

  // Render all pages with data & join content
  const content = (
    await Promise.all(config.pages.map(page => renderer.renderFile(page)))
  ).join("");

  const buildDir = await getBuildDir(projectDir, config.buildDir);

  await writeDocument(renderer, buildDir, config.layout, content);
  await processAssets(renderer, buildDir, config.assets);
};

// Run with global error handler
run().catch(e => {
  // Print without stacktrace if this is an error caused by the user
  if (e instanceof UserError) {
    signale.error(e.message);
  } else {
    signale.error(e);
  }

  // Exit with 1 exit-code
  process.exit(1);
});
