import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { URL } from "node:url";

const siteUrl = new URL(process.env.VITE_SITE_URL || "http://localhost:5173");
const publicDirectory = resolve("public");
const routes = [
  "/",
  "/profile",
  "/projects",
  "/ai-lab",
  "/blog",
  "/resume",
  "/github",
  "/skills",
  "/experience",
  "/contact",
];

await mkdir(publicDirectory, { recursive: true });

const sitemapEntries = routes
  .map((path) => `  <url><loc>${escapeXml(new URL(path, siteUrl).toString())}</loc></url>`)
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;
const robots = `User-agent: *
Allow: /
Disallow: /admin
Sitemap: ${new URL("/sitemap.xml", siteUrl)}
`;

await Promise.all([
  writeFile(resolve(publicDirectory, "sitemap.xml"), sitemap, "utf8"),
  writeFile(resolve(publicDirectory, "robots.txt"), robots, "utf8"),
]);

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
