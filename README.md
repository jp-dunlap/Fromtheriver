Fromtheriver.org
A living archive of Palestinian history, culture, and the ongoing struggle for liberation.
This repository contains the source code for fromtheriver.org, an interactive resource hub designed to serve as a comprehensive and accessible entry point for education, action, and solidarity with Palestine.
Mission & Philosophy
In an era of overwhelming information and deliberate disinformation, clarity is a revolutionary act. Fromtheriver.org was created not as a simple list of links, but as a guided journey—an "unfolding map" that connects the roots of history to the branches of present-day action.
Our guiding philosophy is that understanding the struggle for Palestinian liberation requires tracing a path through its history, its culture, its resistance, and the global calls for solidarity. The website's design reflects this, with a central, flowing "river" that connects each theme, inviting the user to explore the deep and interconnected nature of the cause.
This project is an act of digital solidarity, built to be a durable, beautiful, and unapologetic resource for all who seek justice.
Technology Stack
This project is built with a focus on performance, scalability, and modern web standards.
Vite + React + TypeScript: Component-driven architecture with a fast local development server and optimized production builds.
Tailwind CSS + PostCSS: Utility-first styling compiled locally with purged, minified output.
Custom JavaScript & TypeScript modules: Power the interactive river path, codex modal, tooltips, and data-driven visualizations.
Netlify (or compatible static host): Serves the pre-built `dist/` output with caching configured via the `_headers` file.

Getting Started

```bash
npm install
npm run dev    # start the local development server
npm run build  # produce the optimized production bundle in dist/
npm run preview # preview the production build locally
```

Static assets such as the Atlas of Erasure map live in the `public/` directory and are copied as-is during the build step.
Contributing
This is currently a personally managed project, but the spirit of solidarity is communal. If you find a broken link, have a suggestion for a critical resource, or encounter a technical issue, please feel free to open an issue in this repository.
Licensing
This project uses a dual-license model to both encourage the proliferation of activist tools and protect the integrity of the written work.
Code
All original code in this repository (.html, .css, .js files) is licensed under the MIT License.
This means you are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software. The goal is to empower others to build similar tools for our collective movements.
Content
All original written content, analysis, and the curated structure of resources presented on the website are licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
This means you are free to share and adapt the content for non-commercial purposes, as long as you provide appropriate attribution and share your adaptations under the same license. This protects the work from commercial co-optation and ensures it remains a permanent part of the commons.
From The River To The Sea, Palestine Will Be Free.

## Verifying the Atlas Codex modal locally

```bash
npm ci
npm run build
npm run preview:ci  # serves ./dist on http://127.0.0.1:4173
```

Now open:

- `http://127.0.0.1:4173/atlas` → click any red pin → the frost Codex modal opens **inline**; URL may add `?slug=…`.
- `http://127.0.0.1:4173/atlas?slug=lydda` → auto-opens the modal after pins render.
- Press **Esc** to close; focus returns to the last element and `?slug=` is removed.

If modal does not appear:
- Check the console for `[atlas]` and `[CodexModalHost]` messages.
- Verify `/codex-modal-host.iife.js` and `/codex-modal-host.css` return **200** and correct MIME.
