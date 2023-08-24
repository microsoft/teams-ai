// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { createReadStream, createWriteStream, existsSync } = require('fs');
const { once } = require('events');
const { join } = require('path');
const { argv, exit } = require('process');
const { createInterface } = require('readline');

// Remove first two elements from argv, which are `node` and `script.js`.
// Currently the script takes two arguments, which are assigned to
// gitLogFromRepo and optionalOutputName.
const [ gitLogFromRepo, optionalOutputName ] = argv.slice(2);

if (!gitLogFromRepo) {
throw new TypeError('The captured output of `git log` must be passed in.');
}

if (!existsSync(join(**dirname, gitLogFromRepo))) {
throw new ReferenceError(`The provided file "${gitLogFromRepo}" was not found in ${**dirname}`);
}

// Determine the changelogFile (which contains the formatted merges to main)
// and the repository URL.
let changelogFile;
let repository;
if (gitLogFromRepo.startsWith('dotnet')) {
changelogFile = optionalOutputName || 'dotnet.md';
repository = 'botbuilder-dotnet';
} else if (gitLogFromRepo.startsWith('js')) {
changelogFile = optionalOutputName || 'js.md';
repository = 'botbuilder-js';
} else if (gitLogFromRepo.startsWith('python')) {
changelogFile = optionalOutputName || 'python.md';
repository = 'botbuilder-python';
} else if (gitLogFromRepo.startsWith('java')) {
changelogFile = optionalOutputName || 'java.md';
repository = 'botbuilder-java';
} else if (gitLogFromRepo.startsWith('bf-cli')) {
changelogFile = optionalOutputName || 'bf-cli.md';
repository = 'botframework-cli';
}

// git log --show-pulls --pretty=tformat:"%s" --since=2020-08-13 > dotnet.txt
// git log --show-pulls --pretty=tformat:"%s" --since=2020-08-07 > js.txt
// git log --show-pulls --pretty=tformat:"%s" --since=2020-08-10 > python.txt
// git log --show-pulls --pretty=tformat:"%s" --since=2020-08-17 > java.txt
// git log --show-pulls --pretty=tformat:"%s" --since=2020-08-10 > bf-cli.txt

const preparedStream = createWriteStream(changelogFile);
(async function processLineByLine() {
try {
const rl = createInterface({
input: createReadStream(gitLogFromRepo),
crlfDelay: Infinity
});

    rl.on('line', (line) => {
        // Check for squash merges first. This generates a bulletpoint that
        // by default uses the title of the PR and appends the PR number to
        // the end of the commit message.
        // E.g. "Fix fetch in token server used in E2E Streaming Test (#2944)"
        const matches = /(?<message>.*)\s\(#(?<num>\d*)\)$/gim.exec(line);
        if (matches) {
            const { message, num } = matches.groups;
            preparedStream.write(`- ${message} [[PR ${num}]](https://github.com/microsoft/${repository}/pull/${num})\n`);
        } else {
            // This second check is for PRs that were not squashed and merged.
            // E.g. "Merge pull request #1411 from <fork/branch>"
            const otherFormatMatches = /^(?<message>Merge pull request #(?<num>\d*) from.*)/gim.exec(line);
            if (otherFormatMatches) {
                const { message, num } = otherFormatMatches.groups;
                preparedStream.write(`- ${message} [[PR ${num}]](https://github.com/microsoft/${repository}/pull/${num})\n`)
            }
        }
    });

    await once(rl, 'close');
    console.log(`Changelog "${changelogFile}" created.`);

} catch (err) {
const errMsgPrefix = `An error occurred during the creation of the changelog.
Please file an issue in https://github.com/microsoft/botframework-sdk and provide the necessary reproduction steps.\n`
console.error(errMsgPrefix);
console.error(err);
exit(1);
}
})();
