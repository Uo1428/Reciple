// Dear precious programmer,
// If you're trying to understand this code, please, consider that
// at the time of writing this code, It was written the way humans
// can understand it but I transformed into a dog at Apr 12th 2022
// and accidentally made it unreadable for humans. So, if you're
// trying to understand this code, please, consider being a dog first.

import { ApplicationCommandDataResolvable, Client, ClientEvents, ClientOptions, Interaction, Message } from 'discord.js';
import { InteractionCommandBuilder, RecipleInteractionCommandExecute } from './builders/InteractionCommandBuilder';
import loadModules, { recipleCommandBuilders, recipleCommandBuildersExecute, RecipleScript } from '../modules';
import { interactionCommandBuilders, registerInteractionCommands } from '../registerInteractionCommands';
import { MessageCommandBuilder, RecipleMessageCommandExecute } from './builders/MessageCommandBuilder';
import { getCommand, Logger as LoggerConstructor } from 'fallout-utility';
import commandPermissions from '../commandPermissions';
import isIgnoredChannel from '../isIgnoredChannel';
import { version } from '../version';
import { Config } from './Config';
import logger from '../logger';

export interface RecipleClientOptions extends ClientOptions {
    config: Config;
}

export interface RecipleClientCommands {
    MESSAGE_COMMANDS: { [commandName: string]: MessageCommandBuilder };
    INTERACTION_COMMANDS: { [commandName: string]: InteractionCommandBuilder };
}

// TODO: Add these events to the client
// TODO: Learn to add these bitch to the client
export interface RecipleClientEvents extends ClientEvents {
    recipleMessageCommandCreate: [command: RecipleMessageCommandExecute];
    recipleInteractionCommandCreate: [command: RecipleInteractionCommandExecute];
}

export class RecipleClient extends Client {
    public config?: Config;
    public commands: RecipleClientCommands = { MESSAGE_COMMANDS: {}, INTERACTION_COMMANDS: {} };
    public otherApplicationCommandData: (interactionCommandBuilders|ApplicationCommandDataResolvable)[] = [];
    public modules: RecipleScript[] = [];
    public logger: LoggerConstructor;
    public version: string = version;

    constructor(options: RecipleClientOptions) {
        super(options);

        this.logger = logger(!!options.config.fileLogging.stringifyLoggedJSON, !!options.config.fileLogging.debugmode);

        if (!options.config) throw new Error('Config is not defined.');
        this.config = options.config;

        if (this.config.fileLogging.enabled) this.logger.logFile(this.config.fileLogging.logFilePath, false);

        this.logger.info('Reciple Client v' + version + ' is starting...');
    }

    public async startModules(): Promise<RecipleClient> {
        this.logger.info('Loading modules...');

        const modules = await loadModules(this);
        if (!modules) throw new Error('Failed to load modules.');

        this.modules = modules.modules.map(m => m.script);
        for (const command of modules.commands) {
            if (!command.name) continue;
            this.addCommand(command);
        }

        this.logger.info(`${Object.keys(this.commands.MESSAGE_COMMANDS).length} message commands loaded.`);
        this.logger.info(`${Object.keys(this.commands.INTERACTION_COMMANDS).length} interaction commands loaded.`);

        return this;
    }

    public async loadModules(): Promise<RecipleClient> {
        for (const module_ of this.modules) {
            if (typeof module_?.onLoad === 'function') await Promise.resolve(module_.onLoad(this));
        }

        this.logger.info(`${this.modules.length} modules loaded.`);

        if (!this.config?.commands.interactionCommand.registerCommands) return this;
        
        await registerInteractionCommands(this, [...Object.values(this.commands.INTERACTION_COMMANDS), ...this.otherApplicationCommandData]);
        return this;
    }

    public async addModule(script: RecipleScript, registerCommands: boolean = true): Promise<void> {
        this.modules.push(script);
        if (typeof script?.onLoad === 'function') await Promise.resolve(script.onLoad(this));

        this.logger.info(`${this.modules.length} modules loaded.`);
        for (const command of script.commands ?? []) {
            if (!command.name) continue;
            this.addCommand(command);
        }

        if (!registerCommands || !this.config?.commands.interactionCommand.registerCommands) return;
        await registerInteractionCommands(this, [...Object.values(this.commands.INTERACTION_COMMANDS), ...this.otherApplicationCommandData]);
    }

    public addCommand(command: recipleCommandBuilders): RecipleClient {
        if (command.builder === 'MESSAGE_COMMAND') {
            this.commands.MESSAGE_COMMANDS[command.name] = command as MessageCommandBuilder;
        } else if (command.builder === 'INTERACTION_COMMAND') {
            this.commands.INTERACTION_COMMANDS[command.name] = command as InteractionCommandBuilder;
        } else {
            this.logger.error(`Command "${command.name ?? 'unknown'}" has an invalid builder.`);
        }

        return this;
    }

    public addCommandListeners(): RecipleClient {
        if (this.config?.commands.messageCommand.enabled) this.on('messageCreate', (message) => { this.messageCommandExecute(message) });
        if (this.config?.commands.interactionCommand.enabled) this.on('interactionCreate', (interaction) => { this.interactionCommandExecute(interaction) });

        return this;
    }

    public async messageCommandExecute(message: Message): Promise<RecipleClient> {
        if (!message.content || !this.config?.commands.messageCommand.enabled) return this;

        const parseCommand = getCommand(message.content, this.config?.prefix || '!', this.config?.commands.messageCommand.commandArgumentSeparator || ' ');
        if (!parseCommand?.command || !parseCommand) return this; 
        
        const command = this.commands.MESSAGE_COMMANDS[parseCommand.command.toLowerCase()];
        if (!command) return this;

        if (commandPermissions(command.name, message.member?.permissions, this.config?.permissions.messageCommands, command)) {
            if (!command.allowExecuteInDM && message.channel.type === 'DM' || !command.allowExecuteByBots && (message.author.bot || message.author.system) || isIgnoredChannel(message.channelId, this.config?.ignoredChannels)) return this;
            if (command.validateOptions && !command.getCommandOptionValues(parseCommand)) {
                await message.reply(this.config?.messages.notEnoughArguments || 'Not enough arguments.').catch((err) => this.logger.error(err));
                return this;
            }

            const options: RecipleMessageCommandExecute = {
                message: message,
                command: parseCommand,
                builder: command,
                client: this
            };

            await Promise.resolve(command.execute(options)).catch(err => this._commandExecuteError(err, options));
            this.emit('recipleMessageCommandCreate', options);
        } else {
            await message.reply(this.config?.messages.noPermissions || 'You do not have permission to use this command.').catch((err) => this.logger.error(err));
        }

        return this;
    }

    public async interactionCommandExecute(interaction: Interaction): Promise<RecipleClient> {
        if (!interaction || !interaction.isCommand() || !this.config?.commands.interactionCommand.enabled) return this;

        const command = this.commands.INTERACTION_COMMANDS[interaction.commandName];
        if (!command) return this;

        if (commandPermissions(command.name, interaction.memberPermissions ?? undefined, this.config?.permissions.interactionCommands, command)) {
            if (!command.allowExecuteInDM && interaction.member === null || isIgnoredChannel(interaction.channelId, this.config?.ignoredChannels)) return this;
            if (!command) return this;

            const options: RecipleInteractionCommandExecute = {
                interaction: interaction,
                command: command,
                builder: command,
                client: this
            };
            await Promise.resolve(command.execute(options)).catch(err => this._commandExecuteError(err, options));
            this.emit('recipleInteractionCommandCreate', options);
        } else {
            await interaction.reply(this.config?.messages.noPermissions || 'You do not have permission to use this command.').catch((err) => this.logger.error(err));
        }

        return this;
    }

    private async _commandExecuteError(err: Error, command: recipleCommandBuildersExecute): Promise<void> {
        this.logger.error(`An error occured executing ${command.builder.builder == 'MESSAGE_COMMAND' ? 'message' : 'interaction'} command "${command.builder.name}"`);
        this.logger.error(err);

        if (!err || !command) return;

        if ((command as RecipleMessageCommandExecute)?.message) {
            if (!this.config?.commands.messageCommand.replyOnError) return;
            await (command as RecipleMessageCommandExecute).message.reply(this.config?.messages.error || 'An error occured.').catch((e) => this.logger.error(e));
        } else if ((command as RecipleInteractionCommandExecute)?.interaction) {
            if (!this.config?.commands.interactionCommand.replyOnError) return;
            await (command as RecipleInteractionCommandExecute).interaction.followUp(this.config?.messages.error || 'An error occured.').catch((e) => this.logger.error(e));
        }
    }
}
