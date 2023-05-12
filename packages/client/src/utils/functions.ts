import { AnyCommandBuilder, AnyCommandData, CommandType } from '../types/commands';
import { RestOrArray, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandUserOption, normalizeArray } from 'discord.js';
import { replaceAll } from 'fallout-utility';
import { AnySlashCommandOptionBuilder } from '../types/slashCommandOptions';

export interface RecursiveDefault<T = unknown> {
    default?: T|RecursiveDefault<T>;
}

export function replacePlaceholders(message: string, ...placeholders: RestOrArray<string>) {
    placeholders = normalizeArray(placeholders);

    for (const index in placeholders) {
        message = replaceAll(message, `%${index}%`, placeholders[index]);
    }

    return message;
}

export function getCommandBuilderName(command: AnyCommandBuilder|AnyCommandData|CommandType): keyof typeof CommandType {
    command = typeof command === 'number' ? command : command.commandType;

    switch (command) {
        case CommandType.ContextMenuCommand:
            return 'ContextMenuCommand';
        case CommandType.MessageCommand:
            return 'MessageCommand';
        case CommandType.SlashCommand:
            return 'SlashCommand';
    }
}

export function recursiveDefaults<T = unknown>(data: RecursiveDefault<T>|T): T|undefined {
    function isDefaults(object: any): object is RecursiveDefault<T> {
        return object?.default !== undefined;
    }

    if (!isDefaults(data)) return data;

    return recursiveDefaults(data.default!);
}

export function isSlashCommandOption(data: any): data is AnySlashCommandOptionBuilder|SlashCommandSubcommandBuilder|SlashCommandSubcommandGroupBuilder {
    return data instanceof SlashCommandAttachmentOption ||
    data instanceof SlashCommandBooleanOption ||
    data instanceof SlashCommandChannelOption ||
    data instanceof SlashCommandIntegerOption ||
    data instanceof SlashCommandMentionableOption ||
    data instanceof SlashCommandNumberOption ||
    data instanceof SlashCommandRoleOption ||
    data instanceof SlashCommandStringOption ||
    data instanceof SlashCommandUserOption ||
    data instanceof SlashCommandSubcommandBuilder ||
    data instanceof SlashCommandSubcommandGroupBuilder;
}
