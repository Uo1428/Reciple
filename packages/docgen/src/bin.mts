#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { DocsParser } from './index.js';
import { Command } from 'commander';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Options {
    input: string[];
    custom?: string;
    output: string;
    pretty: boolean;
    root: string;
}

const packageJson = JSON.parse(await readFile(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf-8'));

const cli = new Command()
    .version(packageJson.version)
    .option('-i, --input <string...>', 'Source files to parse docs in')
	.option('-c, --custom [string]', 'Custom docs pages file to use')
    .option('-r, --root [string]', 'Project root directory', '.')
	.option('-o, --output <string>', 'Path to output file')
    .option('-p, --pretty', 'Pretty print JSON output');

const options = (await cli.parseAsync()).opts<Options>();

process.chdir(resolve(options.root));

const parser = new DocsParser({
    files: options.input,
    custom: options.custom
});

await parser.parse();
await parser.save({
    file: resolve(options.output),
    pretty: options.pretty
});
