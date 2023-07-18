#!/usr/bin/env node
import { cancel, confirm, group, intro, isCancel, outro, select, text } from '@clack/prompts';
import { resolvePackageManager } from './utils/functions.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { PackageManager } from './utils/types.js';
import { fileURLToPath } from 'node:url';
import { create } from './create.js';
import { existsSync } from 'node:fs';
import { exit } from 'node:process';
import kleur from 'kleur';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '../');

const isExplicitDir: boolean = !!process.argv[2];

let cwd = resolve(process.argv[2] || '.');

intro(`${kleur.bold().cyan(`Welcome to Reciple!`)}`);

if (cwd === process.cwd() && !isExplicitDir) {
    const newCwd = await text({
        message: 'Set your project directory (Leave empty to use current dir)',
        placeholder: 'Project directory'
    });

    if (isCancel(newCwd)) { cancel('Operation cancelled'); exit(1); }
    if (newCwd) cwd = newCwd;
}

if (existsSync(cwd)) {
    if (!(await stat(cwd)).isDirectory()) {
        console.log(`${kleur.gray(cwd)} ${kleur.green(`is not a directory`)}`);
        exit(1);
    }

    if ((await readdir(cwd)).length > 0) {
        const acceptDir = await confirm({
            message: 'Directory is not empty, would you like to continue?',
            initialValue: false
        });

        if (!acceptDir || isCancel(acceptDir)) { cancel('Operation cancelled'); exit(1); }
    }
}

const templatesRawJSON = await readFile(join(root, 'templates.json'), 'utf-8');
const packageManagers: { label?: string; hint?: string; value: PackageManager|'none'; }[] = [
    {
        label: 'npm',
        hint: 'Uses npm as package manager',
        value: 'npm'
    },
    {
        label: 'yarn',
        hint: 'Uses yarn as package manager',
        value: 'yarn'
    },
    {
        label: 'pnpm',
        hint: 'Uses pnpm as package manager',
        value: 'pnpm'
    },
    {
        label: 'none',
        hint: 'Setup package manager later',
        value: 'none'
    }
];

const resolvedPackageManager = resolvePackageManager();
let firstPackageManagerIndex = packageManagers.findIndex(p => resolvedPackageManager && resolvedPackageManager === p.value);
    firstPackageManagerIndex = firstPackageManagerIndex === -1 ? packageManagers.length - 1 : firstPackageManagerIndex;

const setup = await group({
    template: () => select({
        message: 'Which language would you like to use?',
        // @ts-expect-error Idk why
        options: (JSON.parse(templatesRawJSON) as { name: string; description: string; dir: string }[]).map(m => ({
            label: m.name,
            value: m.dir,
            hint: m.description
        }))
    }),
    esm: () => confirm({
        message: 'Would you like to use ES Modules? (ES modules uses import instead of require)',
        initialValue: false
    }),
    packageManager: () => select<{ label?: string; hint?: string; value: PackageManager|'none'; }[], PackageManager|'none'>({
        message: 'Select your preferred package manager',
        options: [
            packageManagers[firstPackageManagerIndex],
            ...packageManagers.filter((p, i) => i !== firstPackageManagerIndex)
        ]
    }),
}, { onCancel: () => { cancel('Operation cancelled'); exit(1); } });

outro('Setup done!');

create(cwd, join(root, setup.template), setup.esm, setup.packageManager !== 'none' ? setup.packageManager : undefined);
