#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT, SITE_URL } from "./lib/archive.mjs";

const OUTPUT = path.resolve(ROOT, "public/robots.txt");
const requestedBaseUrl =
  process.env.DEPLOY_PRIME_URL || process.env.URL || SITE_URL;
const normalizedBaseUrl = `${requestedBaseUrl}`.trim();
const effectiveBaseUrl = /--fromtheriver\.netlify\.app/i.test(normalizedBaseUrl)
  ? SITE_URL
  : normalizedBaseUrl;
const BASE_URL = effectiveBaseUrl.replace(/\/+$/, "");

const contents = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`;

async function main() {
  await writeFile(OUTPUT, contents, "utf8");
  console.log(`[generate-robots] wrote robots.txt for ${BASE_URL}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[generate-robots] failed:", error.message ?? error);
    process.exit(1);
  });
