---
name: Bug report
about: Create a report to help us improve
title: ''
labels: 'bug'
assignees: ''

---

#### Describe the bug

A clear and concise description of what the bug is.

#### To Reproduce

Steps to reproduce the behavior:
1. Run `docmaker`
1. See error

#### Expected behavior

A clear and concise description of what you expected to happen.

#### Configuration

<!-- Please paste your docmaker.yaml here -->

```yaml
layout: layout.html
data:
  - data.yaml
pages:
  - "_titlepage.html"
  - "_toc.md"
  - "[0-9]+*.md"
assets:
  - styles.css
```

#### Desktop (please complete the following information)

 - OS / version: [e.g. `Ubuntu 20.04`]
 - Docmaker version: [e.g. `0.1.2`]

#### Additional context

Add any other context (i.e. screenshots or console output) about the problem here.
