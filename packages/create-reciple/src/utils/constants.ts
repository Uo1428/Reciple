import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const root = join(__dirname, '../../');
export const packageJSON = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

export const packages = {
    'TYPESCRIPT': '^5.0.2',
    'RIMRAF': '^4.4.1',
    'RECIPLE': packageJSON.devDependencies.reciple,
    'DISCORDJS': packageJSON.devDependencies['discord.js'],
    'NODEMON': packageJSON.devDependencies['nodemon']
};

export const packageManagerPlaceholders = {
    'npm': {
        'SCRIPT_RUN': 'npm run',
        'BIN_EXEC': 'npx',
        'INSTALL_ALL': 'npm install',
        'INSTALL_PKG': 'npm install',
        'UNINSTALL_PKG': 'npm uninstall'
    },
    'pnpm': {
        'SCRIPT_RUN': 'pnpm run',
        'BIN_EXEC': 'pnpm exec',
        'INSTALL_ALL': 'pnpm install',
        'INSTALL_PKG': 'pnpm add',
        'UNINSTALL_PKG': 'pnpm remove'
    },
    'yarn': {
        'SCRIPT_RUN': 'yarn run',
        'BIN_EXEC': 'yarn exec',
        'INSTALL_ALL': 'yarn',
        'INSTALL_PKG': 'yarn add',
        'UNINSTALL_PKG': 'yarn remove'
    }
};