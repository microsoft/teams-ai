// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { createReadStream, createWriteStream, existsSync } = require("fs");
const { once } = require("events");
const { join } = require("path");
const { argv, exit } = require("process");
const { createInterface } = require("readline");

// Remove first two elements from argv, which are `node` and `script.js`.
// Currently the script takes two arguments, which are assigned to
// gitLogFromRepo and optionalOutputName.
const [gitLogFromRepo, optionalOutputName] = argv.slice(2);

if (!gitLogFromRepo) {
  throw new TypeError("The captured output of `git log` must be passed in.");
}

if (!existsSync(join(__dirname, gitLogFromRepo))) {
  throw new ReferenceError(`The provided file "${gitLogFromRepo}" was not found in ${__dirname}`);
}

// Determine the changelogFile
let changelogFile;
  changelogFile = optionalOutputName || "CHANGELOG.md";


// NOTE: update the --since date to the date of the last release.
// Run the 'createChangelog.sh' script, or run:
// git log --show-pulls --pretty=tformat:"%s" --since=2023-08-13 > changelog.txt | node gitlog.js changelog.txt

const preparedStream = createWriteStream(changelogFile);
const js = [];
const dotnet = [];
const python = [];
(async function processLineByLine() {
  try {
    const rl = createInterface({
      input: createReadStream(gitLogFromRepo),
      crlfDelay: Infinity
    });

    rl.on("line", line => {
      // Check for squash merges first. This generates a bulletpoint that
      // by default uses the title of the PR and appends the PR number to
      // the end of the commit message.
      // E.g. "Fix fetch in token server used in E2E Streaming Test (#2944)"
      const matches = /(?<message>.*)\s\(#(?<num>\d*)\)$/gim.exec(line);
      if (matches) {
        const { message, num } = matches.groups;
        const line = `- ${message} [[PR ${num}]](https://github.com/microsoft/teams-ai/pull/${num})\n`;
         if (message.startsWith("[JS]")) {
          js.push(line)
         } else if (message.startsWith("[C#]")) {
          dotnet.push(line)
         }
         else if (message.startsWith("[PY]")) {
          python.push(line);
         } else {
          // The commit message does not start with a tag, or it starts with [repo], which can be applied to all changelogs.
          js.push(line);
          dotnet.push(line);
          python.push(line);
         }
      } else {
        // This second check is for PRs that were not squashed and merged.
        // E.g. "Merge pull request #1411 from <fork/branch>"
        const otherFormatMatches = /^(?<message>Merge pull request #(?<num>\d*) from.*)/gim.exec(line);
        if (otherFormatMatches) {
          const { message, num } = otherFormatMatches.groups;
          const otherLine = (`- ${message} [[PR ${num}]](https://github.com/microsoft/teams-ai/pull/${num})\n`);
          js.push(otherLine);
          dotnet.push(otherLine);
          python.push(otherLine);
        }
      }
    });

    await once(rl, "close");
    preparedStream.write("# JavaScript SDK\n");
    js.forEach(line => preparedStream.write(line));
    preparedStream.write("\n# .NET SDK\n");
    dotnet.forEach(line => preparedStream.write(line));
    preparedStream.write("\n# Python SDK\n");
    python.forEach(line => preparedStream.write(line));
    console.log(`Changelog "${changelogFile}" created.`);
  } catch (err) {
    const errMsgPrefix = `An error occurred during the creation of the changelog.
Please file an issue in https://github.com/microsoft/botframework-sdk and provide the necessary reproduction steps.\n`;
    console.error(errMsgPrefix);
    console.error(err);
    exit(1);
  }
})();
