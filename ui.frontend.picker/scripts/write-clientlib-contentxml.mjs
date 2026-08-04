import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentXml = join(root, "client-libs", "asset-picker.spa", ".content.xml");

mkdirSync(dirname(contentXml), { recursive: true });
writeFileSync(
  contentXml,
  `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0"
    jcr:primaryType="cq:ClientLibraryFolder"
    allowProxy="{Boolean}true"
    categories="[asset-picker.spa]"
    cssProcessor="[default:none,min:none]"
    jsProcessor="[default:none,min:none]"/>
`,
);

console.log("Wrote", contentXml);
