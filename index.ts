import * as fs from "fs";
import { promisify } from "util";
import * as MarkdownIt from "markdown-it";
import * as tocPlugin from "markdown-it-toc-done-right";
import * as anchorPlugin from "markdown-it-anchor";
import * as umlPlugin from "markdown-it-textual-uml";
import { getLanguage, highlight } from "highlight.js";
import { findProjectDirectory, loadConfig } from "./config";
import { Liquid } from "liquidjs";
import { extname } from "path";
import * as signale from "signale";
import { UserError } from "./errors";
import * as yaml from "yaml";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Highlight-JS highlighter for markdown-it
const highlightJsHighlight = (str: string, lang: string) => {
  if (lang && getLanguage(lang)) {
    try {
      return highlight(lang, str).value;
    } catch (_) {}
  }

  return ""; // use external default escaping
};

// Create new liquid renderer
const liquid = new Liquid();

// Create new markdown renderer
const markdown = new MarkdownIt({
  typographer: true,
  linkify: true,
  highlight: highlightJsHighlight,
  html: true
});

// Register markdown-it plugins
markdown.use(tocPlugin, { level: 2 });
markdown.use(anchorPlugin);
markdown.use(umlPlugin);

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

const renderPage = async (data: any, page: string): Promise<string> => {
  const rawContent = await readFile(page);
  // TODO: load custom data from project data files
  const processedContent = await liquid.parseAndRender(rawContent.toString(), {
    ...data,
    pagebreak: `<div style="page-break-after: always"></div>`
  });

  const fileExt = extname(page);

  // TODO: Doing files one-by-one causes the Table of Contents to break.
  // TODO: We should probably be creating a custom table of contents as
  switch (fileExt) {
    case ".html":
      return processedContent;
    case ".md":
      return markdown.render(processedContent, {});
    default:
      signale.error(`Could not render file with "${fileExt}" extension`);
      return processedContent;
  }
};

const run = async () => {
  // Find directory containing project config
  const projectDirectory = await findProjectDirectory();

  // Load config from project directory
  const config = await loadConfig(projectDirectory);

  // Load & combine all data files
  let data = {};

  for (const file of config.data) {
    const dataFileData = await loadDataFile(file);
    data = {
      ...data,
      ...dataFileData
    };
  }

  // Render all pages & join content
  const content = (
    await Promise.all(config.pages.map(page => renderPage(data, page)))
  ).join("");

  const layout = await readFile(config.layout);

  const document = await liquid.parseAndRender(layout.toString(), {
    ...data,
    content: content
  });

  await writeFile(projectDirectory + "/index.html", document);
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
