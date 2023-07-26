/*
import * as Chinese from 'cldr-data/main/zh/numbers.json';
import * as English from 'cldr-data/main/en/numbers.json';
import * as French from 'cldr-data/main/fr/numbers.json';
import * as Dutch from 'cldr-data/main/nl/numbers.json';
import * as German from 'cldr-data/main/de/numbers.json';
import * as Japanese from 'cldr-data/main/ja/numbers.json';
import * as LikelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import * as NumberingSystem from 'cldr-data/supplemental/numberingSystems.json';
import * as Portuguese from 'cldr-data/main/pt/numbers.json';
import * as Spanish from 'cldr-data/main/es/numbers.json';
*/

// Ensure using node 12 because of recursive mkdir
if (!process.env.GEN_CLDR_DATA_IGNORE_NODE_VERSION && process.version.split('.')[0] < 'v12') {
    console.error(`
Your node version appears to be below v12: ${process.version}.
This script will not run correctly on earlier versions of node.
Set 'GEN_CLDR_DATA_IGNORE_NODE_VERSION' environment variable to truthy to override`);
}

import fs from 'fs';
import path from 'path';
import cp from 'child_process';
import os from 'os';

const tempDirectoryName = '.temp-gen-cldr-data';
const tempProjectName = 'temp';
const tempDirectory = path.join(os.tmpdir(), tempDirectoryName, tempProjectName);
const cldrDataDirectory = path.join(tempDirectory, './node_modules/cldr-data');
const vendorDirectory = path.join(__dirname, '../vendor/cldr-data');
const cldrDataPackageName = 'cldr-data';
const cldrDataPackageVersion = '35.1.0';

const numbersDirectoryPaths = ['main/zh', 'main/en', 'main/fr', 'main/nl', 'main/de', 'main/ja', 'main/pt', 'main/es'];
const supplementalDirectoryName = 'supplemental';

const numbersFileName = 'numbers.json';
const likelySubtagsFileName = 'likelySubtags.json';
const numberingSystemsFileName = 'numberingSystems.json';

async function main() {
    const plog = prettyLogger('main');
    try {
        plog('Making temporary directory: ' + tempDirectory);
        createIfNotExistSync(tempDirectory);
    } catch (err: unknown) {
        plog('Could not create temp directory');
        plog(err);
        plog('Cancelling...');
        process.exit(1);
    }

    try {
        plog('Creating temp project to install cldr-data into');
        await exec(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['init', '-y'], {
            cwd: tempDirectory,
            env: process.env,
        });
        plog('Installing cldr-data into temporary directory (This takes a very long time...)');
        await exec(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['i', `${cldrDataPackageName}@${cldrDataPackageVersion}`, '--no-save'],
            { cwd: tempDirectory, env: process.env }
        );
    } catch (err: unknown) {
        plog('Could not install cldr-data');
        plog(err);
        plog('Cancelling...');
        process.exit(1);
    }

    try {
        plog('Creating vendor directories');
        numbersDirectoryPaths.forEach((v) => {
            createIfNotExistSync(path.join(vendorDirectory, v));
        });
        createIfNotExistSync(path.join(vendorDirectory, supplementalDirectoryName));
    } catch (err: unknown) {
        plog('Could not create vendor directories');
        plog(err);
        plog('Cancelling...');
        process.exit(1);
    }

    try {
        plog('Copying files from temporary cldr-data to vendor cldr-data');
        numbersDirectoryPaths.forEach((v) => {
            fs.copyFileSync(
                path.join(cldrDataDirectory, v, numbersFileName),
                path.join(vendorDirectory, v, numbersFileName)
            );
        });

        fs.copyFileSync(
            path.join(cldrDataDirectory, supplementalDirectoryName, likelySubtagsFileName),
            path.join(vendorDirectory, supplementalDirectoryName, likelySubtagsFileName)
        );
        fs.copyFileSync(
            path.join(cldrDataDirectory, supplementalDirectoryName, numberingSystemsFileName),
            path.join(vendorDirectory, supplementalDirectoryName, numberingSystemsFileName)
        );
    } catch (err: unknown) {
        plog('Could not copy files');
        plog(err);
        plog('Cancelling...');
        process.exit(1);
    }

    try {
        plog('Cleaning up temp directory');
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.rmdirSync(tempDirectory, {
            recursive: true,
        });
    } catch (err: unknown) {
        plog('Could not clean up temp directory: ' + tempDirectory);
        plog(err);
        plog('Cancelling...');
        process.exit(1);
    }
}

function createIfNotExistSync(path) {
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.mkdirSync(path, { recursive: true });
    } catch (e) {
        if (!e.code === 'EEXIST') {
            throw e;
        }
    }
}

async function exec(command, args, opts) {
    const stdout = prettyLogger(command, 'stdout');
    const stderr = prettyLogger(command, 'stderr');
    const error = prettyLogger(command, 'error');

    return new Promise((resolve, reject) => {
        const p = cp.spawn(command, args, opts);

        p.stdout.on('data', (data) => {
            stdout(`[${command}][stdout]: ${data}`);
        });

        p.stderr.on('data', (data) => {
            stderr(`[${command}][stderr]: ${data}`);
        });

        p.on('error', (err) => {
            error(err);
        });

        p.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`"${command} ${args.join(' ')}" returned unsuccessful error code: ${code}`));
            } else {
                resolve();
            }
        });
    });
}

function prettyLogger(...labels) {
    const header = `[${labels.join('][')}]: `;
    return (content) => {
        const lines = content.split('\n');
        lines.forEach((v) => console.log(header + v));
    };
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .then(() => {
        console.log('Complete');
        process.exit(0);
    });
