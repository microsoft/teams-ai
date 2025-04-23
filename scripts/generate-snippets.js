// generate-snippets.js

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get the output folder from command-line args
const outputFolder = process.argv[2];

if (!outputFolder) {
  console.error(
    "❌ Please provide an output folder path as the first argument."
  );
  process.exit(1);
}

const resolvedOutputPath = path.resolve(outputFolder);

// Remove existing folder if it exists
if (fs.existsSync(resolvedOutputPath)) {
  console.log(`🧹 Removing existing folder: ${resolvedOutputPath}`);
  fs.rmSync(resolvedOutputPath, { recursive: true, force: true });
}

// Recreate the output folder
fs.mkdirSync(resolvedOutputPath, { recursive: true });

try {
  console.log("✂️  Generating snippets...");
  execSync(
    `bluehawk snip --output "${resolvedOutputPath}" teams.ts --ignore packages/graph/** --ignore "!**/*.ts"`,
    { stdio: "inherit", shell: true }
  );
  console.log("✅ Snippets generated.");
  process.exit(0);
} catch (err) {
  console.error("❌ Failed to generate snippets.");
  process.exit(1);
}
