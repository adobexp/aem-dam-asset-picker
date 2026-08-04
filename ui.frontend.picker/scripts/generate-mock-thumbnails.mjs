/**
 * Generates the placeholder thumbnails referenced by the mock API fixtures.
 * Run once via `npm run mocks:thumbs`; the output is committed so `start:mock`
 * works on a fresh clone without a generation step.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "mocks", "thumbs");

const thumbnails = [
  { name: "brand-logo-primary", label: "LOGO", from: "#1473e6", to: "#0d66d0" },
  { name: "brand-logo-mono", label: "MONO", from: "#4b4b4b", to: "#232323" },
  { name: "brand-guidelines", label: "PDF", from: "#d7373f", to: "#a02128" },
  { name: "brand-palette", label: "SWATCH", from: "#e68619", to: "#cb6f10" },
  { name: "campaign-hero-spring", label: "HERO", from: "#2d9d78", to: "#12805c" },
  { name: "campaign-hero-summer", label: "HERO", from: "#e34850", to: "#c9252d" },
  { name: "campaign-banner-wide", label: "BANNER", from: "#6767ec", to: "#5c5ce0" },
  { name: "campaign-teaser-video", label: "VIDEO", from: "#893ba7", to: "#6f2b8f" },
  { name: "product-bottle-front", label: "PACK", from: "#0d9f8a", to: "#068174" },
  { name: "product-bottle-angle", label: "PACK", from: "#118ab5", to: "#0b7495" },
  { name: "product-carton-render", label: "3D", from: "#c8862f", to: "#a56b1c" },
  { name: "product-sheet", label: "DOC", from: "#5a5a5a", to: "#3a3a3a" },
  { name: "folder", label: "FOLDER", from: "#8e8e8e", to: "#6e6e6e" },
];

const svg = ({ label, from, to }) => `<svg xmlns="http://www.w3.org/2000/svg" width="319" height="319" viewBox="0 0 319 319" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="319" height="319" fill="url(#g)"/>
  <circle cx="245" cy="74" r="112" fill="#ffffff" opacity="0.08"/>
  <circle cx="62" cy="252" r="86" fill="#000000" opacity="0.08"/>
  <text x="159.5" y="172" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="4" fill="#ffffff">${label}</text>
</svg>
`;

await mkdir(outDir, { recursive: true });
await Promise.all(thumbnails.map((thumb) => writeFile(resolve(outDir, `${thumb.name}.svg`), svg(thumb), "utf8")));

console.log(`Wrote ${thumbnails.length} mock thumbnails to ${outDir}`);
