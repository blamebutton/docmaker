# Todo

- Make it possible to use top-level headings in seperate files
  - Makes linters happy
  - Automatically increase all header levels when this is done
- "Templates"
  Regular docmaker projects can be included, pages & layouts from these projects can be referenced.

  - This can be chained
  - Allow specifying versions to prevent breaking dependent templates when making breaking changes

  ```yaml
  includes:
    - material-template
  layout: "material-template:layout"
  pages:
    - "material-template:titlepage.html"
    - "material-template:toc.html"
    - "chapter-[0-9]+.md"
  ```
