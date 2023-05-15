import { RecipleClient, RecipleModule, RecipleModuleScript } from '@reciple/client';
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync } from 'fs';
import { Logger } from '@reciple/client';
import path from 'path';

export interface PartialPackageJson {
    name: string;
    description?: string;
    keywords?: string[];
    recipleModule?: string;
    type?: "module"|"commonjs";
    main?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

export interface RecipleNPMLoaderOptions {
    /**
     * The node_modules folder path
     */
    nodeModulesFolder: string;
    /**
     * Define to only use modules that are in package.json dependencies and dev dependencies
     */
    packageJsonPath?: string;
    /**
     * Disables version check when starting modules
     */
    disableVersionChecks: boolean;
    /**
     * Ignored package names
     */
    ignoredPackages: string[];
}

export class RecipleNPMLoader implements RecipleModuleScript, RecipleNPMLoaderOptions {
    readonly versions: string = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf-8')).peerDependencies['@reciple/client'];
    readonly modules: RecipleModule[] = [];

    public client!: RecipleClient;
    public logger?: Logger;

    public nodeModulesFolder: string;
    public packageJsonPath?: string;
    public disableVersionChecks: boolean;
    public ignoredPackages: string[];

    get cwd() { return process.cwd(); }

    constructor(options?: RecipleNPMLoaderOptions) {
        this.nodeModulesFolder = options?.nodeModulesFolder ?? path.join(process.cwd(), 'node_modules');
        this.packageJsonPath = options?.packageJsonPath;
        this.disableVersionChecks = options?.disableVersionChecks ?? false;
        this.ignoredPackages = options?.ignoredPackages ?? [];
    }

    public async onStart(client: RecipleClient<false>): Promise<boolean> {
        this.client = client;
        this.logger = client.logger?.clone({ name: 'NPMLoader' });

        this.modules.push(...await this.getModules(this.nodeModulesFolder));

        this.logger?.log(`Found (${this.modules.length}) NPM Reciple modules`);

        await this.client.modules.startModules({
            modules: this.modules,
            addToModulesCollection: true
        });

        return true;
    }

    /**
     * Get valid modules from given node_modules folder
     * @param node_modules The node_modules folder
     */
    public async getModules(node_modules: string): Promise<RecipleModule[]> {
        if (!existsSync(node_modules)) return [];

        this.logger?.debug(`Loading modules from '${node_modules}'`);

        const packageJson = this.packageJsonPath ? this.getPackageJson(this.packageJsonPath) : null;
        const dependencies = packageJson ? { ...packageJson?.dependencies, ...packageJson?.devDependencies } : null;

        let contents: string[] = [];

            if (!packageJson) {
                contents = readdirSync(node_modules).map(f => path.join(node_modules, f));
            } else {
                for (const dependency of Object.keys(dependencies ?? {})) {
                    const location = path.join(node_modules, dependency);
                    if (!existsSync(location)) continue;

                    contents.push(location);
                }
            }

            contents = contents.filter(f => lstatSync(f).isDirectory() || lstatSync(f).isSymbolicLink());

        const folders = contents.filter(f => !path.basename(f).startsWith('@')).map(f => lstatSync(f).isSymbolicLink() ? path.join(this.cwd, readlinkSync(f)) : f);
        const withSubfolders = contents.filter(f => path.basename(f).startsWith('@')).map(f => lstatSync(f).isSymbolicLink() ? path.join(this.cwd, readlinkSync(f)) : f);

        this.logger?.debug(`Found (${folders.length}) node_modules package folders.`);
        this.logger?.debug(`Found (${withSubfolders.length}) node_modules folders with package subfolders.`);

        const moduleFiles: string[] = [];

        for (const folder of folders) {
            const isValid = await this.isValidModuleFolder(folder, dependencies || undefined);

            this.logger?.debug(isValid, folder);
            if (!isValid) continue;

            const packageJson = this.getPackageJson(path.join(folder, 'package.json'), true);
            const moduleFile: string = path.join(folder, packageJson.recipleModule);

            moduleFiles.push(moduleFile);
        }

        for (const folder of withSubfolders) {
            const subFolders = readdirSync(folder).map(f => path.join(folder, f)).filter(f => lstatSync(f).isDirectory());

            for (const subFolder of subFolders) {
                const isValid = await this.isValidModuleFolder(subFolder, dependencies || undefined);

                this.logger?.debug(isValid, subFolder);
                if (!isValid) continue;

                const packageJson: { name: string; keywords: string[]; recipleModule: string; } = JSON.parse(readFileSync(path.join(subFolder, 'package.json'), 'utf-8'));
                const moduleFile: string = path.join(subFolder, packageJson.recipleModule);

                moduleFiles.push(moduleFile);
            }
        }

        if (moduleFiles.length) this.logger?.debug(`Loading modules:\n  `, moduleFiles.join('\n  '));

        return this.client.modules.resolveModuleFiles(moduleFiles, this.disableVersionChecks);
    }

    /**
     * Check if folder is a contains valid reciple module
     * @param folder The module folder
     * @param packageJsonDependencies Define to check if the module is in dependencies
     */
    public async isValidModuleFolder(folder: string, packageJsonDependencies?: Record<string, string>): Promise<boolean> {
        const packageJsonPath = path.join(folder, 'package.json');
        if (!existsSync(packageJsonPath)) return false;

        const packageJson = this.getPackageJson(packageJsonPath);
        if (this.ignoredPackages.includes(packageJson.name)) return false;
        if (packageJsonDependencies && !packageJsonDependencies[packageJson.name]) return false;
        if (!packageJson.recipleModule || !existsSync(path.join(folder, packageJson.recipleModule))) return false;
        if (!packageJson.keywords?.includes('reciple-module')) return false;

        return true;
    }

    /**
     * Get package.json partial contents
     * @param file The package.json path
     * @param isRecipleModule Reciple module type guard
     */
    public getPackageJson(file: string, isRecipleModule?: false): PartialPackageJson;
    public getPackageJson(file: string, isRecipleModule: true): PartialPackageJson & { recipleModule: string; keywords: string[]; };
    public getPackageJson(file: string, _isRecipleModule?: boolean): PartialPackageJson {
        return JSON.parse(readFileSync(file, 'utf-8'));
    }
}
