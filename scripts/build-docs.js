// build-docs.js
const { spawn } = require("child_process");

console.log("📚 Building documentation...");

const child = spawn("mdbook", ["build", "book"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
});

let hasError = false;

// Monitor stdout and stderr for [ERROR]
const checkForErrors = (data) => {
  const output = data.toString();
  process.stdout.write(output); // Forward output
  if (output.includes("[ERROR]")) {
    hasError = true;
  }
};

child.stdout.on("data", checkForErrors);
child.stderr.on("data", checkForErrors);

child.on("close", (code) => {
  if (hasError) {
    console.error("❌ Documentation build failed - errors detected");
    process.exit(1);
  } else if (code !== 0) {
    console.error("❌ Documentation build failed");
    process.exit(code);
  } else {
    console.log("✅ Documentation built successfully");
    process.exit(0);
  }
});
