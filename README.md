# Docmaker

![github workflow](https://img.shields.io/github/actions/workflow/status/BlameButton/docmaker/.github/workflows/npm-test.yml?branch=master)
![npm](https://img.shields.io/npm/v/@blamebutton/docmaker?style=flat-square)
![dependencies](https://img.shields.io/librariesio/release/npm/@blamebutton/docmaker?style=flat-square)

Docmaker is a **WIP** markdown documentation rendering tool.

---

## Usage

`$ docmaker <dir>`

Docmaker will try to find `docmaker.yaml` in the current directory or above and resolve all filepaths specified in the config relative to this `project directory`.

## Config

Via a config file called `docmaker.yaml` you can specify pages to render, which data to load and which layout HTML file the document should use.

### Example

```yaml
layout: layout.html
data:
  - data.yaml
  - dynamic_data.js
pages:
  - "_titlepage.html"
  - "_toc.md"
  - "[0-9]+*.md"
assets:
  - styles.css.liquid
```

### Layout

Every docmaker project can specify a `layout` file to use when rendering the document. All pages will be rendered, joined and added into the layout file to render the final document.

### Pages

You can specify [globs](<https://en.wikipedia.org/wiki/Glob_(programming)>) for files to load as `pages`. These globs are expanded, sorted and the resulting filepaths will be loaded as files, processed and joined together into a document.

### Assets

Using `assets`, you may specify additional assets to copy into the build dist directory in case they are needed for the final render to PDF. For example you can specify your document CSS or images needed to render the PDF.

It is also possible to use data variables in assets by giving the asset file a `.liquid` extension.

### Data

Because every file loaded by **docmaker** is pre-processed using the Liquid templating engine, you can specify static (using yaml) or dynamic (using javascript) `data` files to load before rendering the pages. All pages will get the output from these datafiles as liquid variables for use while rending their content.
