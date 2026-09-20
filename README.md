# Econ 125 study guide: Lectures 1 to 4

A study site covering distributions, moments, conditional expectation and sampling, with derivations, worked examples and interactive visuals (including 3D models you can rotate).

Live site: `https://gaarbra.github.io/econ125-study-guide/`

## What is in the repo

- `index.html` is the finished site. It is one self-contained file, so GitHub Pages can serve it as is.
- `source/` holds everything needed to rebuild `index.html`: the page text and equations in `source/src/`, the interactive widgets in `source/js/`, and the build script.

## Publish it with GitHub Pages

1. Create a new repository on GitHub and upload these files (or push them with git).
2. Open **Settings**, then **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose the `main` branch and the `/ (root)` folder, and save.
4. After about a minute the site is live at the address shown on that settings page.

Pages sites are public, even when the repository is private on most plans.

## Edit and rebuild

Equations are written in LaTeX between `$...$` (inline) or `$$...$$` (display) inside the HTML files in `source/src/`. The build script turns them into inline SVG, so the finished page needs no math library at runtime.

```
cd source
npm install
npm run build
```

This rewrites `index.html` in the repo root. Commit and push it, and Pages updates.

## Notes

The interactive widgets are plain JavaScript on canvas, with no external libraries. The only outside request the page makes is to Google Fonts, and it falls back to system fonts if that is blocked.
