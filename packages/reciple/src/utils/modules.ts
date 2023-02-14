import { Awaitable, path } from 'fallout-utility';
import { IConfig } from '../classes/Config';
import { cwd } from './cli';
import { existsSync, lstatSync, mkdirSync, readdirSync } from 'fs';
import micromatch from 'micromatch';

export async function getModules(config: IConfig['modules'], filter?: (filename: string) => Awaitable<boolean>): Promise<string[]> {
    const modules: string[] = [];
    const { globby, isDynamicPattern } = await import('globby');

    for (const folder of config.modulesFolders) {
        const dir = path.isAbsolute(folder) ? folder : path.join(cwd, folder);

        if (isDynamicPattern(dir)) {
            let modulesFolders = await globby(dir, {
                    cwd,
                    onlyDirectories: true,
                    absolute: true
                });

                modulesFolders = modulesFolders.filter(f => !micromatch.isMatch(path.basename(f), config.exclude));

            modules.push(...await getModules({
                ...config,
                modulesFolders
            }));

            continue;
        }

        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        if (!lstatSync(dir).isDirectory()) continue;

        const files = readdirSync(dir).map(file => path.join(dir, file)).filter(f => !micromatch.isMatch(path.basename(f), config.exclude));
        modules.push(...files.filter(file => (filter ? filter(file) : file.endsWith('.js'))));
    }

    return modules;
}
