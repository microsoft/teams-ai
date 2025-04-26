// generate-snippets.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
// Check if there are any script args
const possibleScriptArgs = ['--clear-existing-snips'];
const clearExistingSnips = extraArgs.includes('--clear-existing-snips');

// Remove any script-related args from the command line arguments
const extraArgs = args.filter((arg) => !possibleScriptArgs.includes(arg));

const prepareOutputFolder = (folder) => {
  const resolvedOutputPath = path.resolve(folder);
  if (!clearExistingSnips) {
    // Just create it if it doesn't exist
    if (!fs.existsSync(resolvedOutputPath)) {
      fs.mkdirSync(resolvedOutputPath, { recursive: true });
      return;
    }
  }

  // Remove existing folder if it exists and if it's not the current working directory
  if (fs.existsSync(resolvedOutputPath) && resolvedOutputPath !== process.cwd()) {
    console.log(`🧹 Removing existing folder: ${resolvedOutputPath}`);
    fs.rmSync(resolvedOutputPath, { recursive: true, force: true });
  }

  // Recreate the output folder
  fs.mkdirSync(resolvedOutputPath, { recursive: true });
};

// Find project root (where package.json is)
const findProjectRoot = () => {
  let currentDir = __dirname;
  while (currentDir !== '/') {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find project root directory');
};

const projectRoot = findProjectRoot();
process.chdir(projectRoot); // Ensure we're in project root

// Default arguments
const defaultArgs = {
  input: path.join(projectRoot, 'teams.ts'),
  '--output': [path.join(projectRoot, 'book/generated-snippets/ts')],
  '--ignore': ['packages/graph/**', '!**/*.ts'],
};

// Parse extra args
const extraArgsMap = {};
for (let i = 0; i < extraArgs.length; i++) {
  const arg = extraArgs[i];
  if (arg.startsWith('--')) {
    // If next item doesn't start with --, treat it as value
    const values = [];
    while (i + 1 < extraArgs.length && !extraArgs[i + 1].startsWith('--')) {
      values.push(extraArgs[++i]);
    }
    extraArgsMap[arg] = values;
  } else {
    // Accept only 1 non-flag argument (input)
    extraArgsMap.input = path.resolve(projectRoot, arg);
  }
}

// Merge args, allowing extra args to override defaults
const finalArgs = { ...defaultArgs, ...extraArgsMap };

// Prepare output directory
prepareOutputFolder(finalArgs['--output'][0]);

// Convert to array of args
const allArgs = ['snip', finalArgs.input];
delete finalArgs.input; // Remove input from finalArgs
for (const [key, values] of Object.entries(finalArgs)) {
  if (typeof values === 'string') {
    allArgs.push(key, values);
  } else {
    allArgs.push(...values.flatMap((value) => [key, value]));
  }
}

try {
  console.log('✂️  Generating snippets...');
  console.log(`Running: bluehawk ${allArgs.join(' ')}`);
  execSync(`bluehawk ${allArgs.join(' ')}`, { stdio: 'inherit', shell: true });
  console.log('✅ Snippets generated.');
  process.exit(0);
} catch (err) {
  console.error('❌ Failed to generate snippets.');
  process.exit(1);
}
