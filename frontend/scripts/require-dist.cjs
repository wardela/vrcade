const fs = require("fs");
const path = require("path");

const distIndexPath = path.resolve(__dirname, "..", "dist", "index.html");

if (!fs.existsSync(distIndexPath)) {
  console.error(
    [
      "Missing built frontend output.",
      `Expected: ${distIndexPath}`,
      "Run `npm run build:frontend` first.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`Using built frontend: ${distIndexPath}`);
