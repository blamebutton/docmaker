import * as findUp from 'find-up';
import {basename, extname, join as pathJoin} from 'path';
import * as signale from 'signale';
import {Config, findProjectDirectory} from './config';
import {processDataFiles} from './data';
import {DocRenderer} from './doc-renderer';
import UserError from './errors/user-error';
import {copyFile, joinFiles, mkdir, writeFile} from './utils/file-utils';

export const logger = signale;

const getBuildDir = async (projectDir: string, buildDirName: string): Promise<string> => {
  const buildDir = pathJoin(projectDir, buildDirName);
  const exists = await findUp.exists(buildDir);

  // Create build directory if it does not yet exist
  if (!exists) {
    await mkdir(buildDir);
  }

  return buildDir;
};

const processAssets = async (renderer: DocRenderer, buildDir: string, assets: string[]) => {
  for (const assetPath of assets) {
    const assetBaseName = basename(assetPath);
    const extension = extname(assetBaseName);
    const assetDistPath = pathJoin(buildDir, assetBaseName);

    switch (extension) {
      case '.liquid':
        const renderedAsset = await renderer.renderLiquidFile(assetPath);
        // Remove liquid extension from resulting file
        await writeFile(assetDistPath.replace(extension, ''), renderedAsset);
        break;
      default:
        await copyFile(assetPath, assetDistPath);
    }
  }
};

const writeDocument = async (renderer: DocRenderer, buildDir: string, layout: string, content: string) => {
  // Render layout with data & content
  const document = await renderer.renderLiquidFile(layout, {
    content: content
  });

  const filePath = pathJoin(buildDir, 'index.html');
  await writeFile(filePath, document);
};

const run = async () => {
  const dir = await findProjectDirectory();
  const config = await Config.fromDirectory(dir);
  const data = await processDataFiles(dir, config.data);
  const renderer = new DocRenderer(data);

  // Render all pages with data & join content
  const joined = await joinFiles(config.pages);
  const content = await renderer.renderPage(joined);
  const buildDir = await getBuildDir(dir, config.buildDir);

  await writeDocument(renderer, buildDir, config.layout, content);
  await processAssets(renderer, buildDir, config.assets);
};

// Run with global error handler
run().catch(e => {
  // Print without stacktrace if this is an error caused by the user
  if (e instanceof UserError) {
    logger.error(e.message);
  } else {
    logger.error(e);
  }
  // Exit with 1 exit-code
  process.exit(1);
});
