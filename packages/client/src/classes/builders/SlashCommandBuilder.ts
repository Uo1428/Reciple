import discordjs, { ApplicationCommandOptionType, Awaitable, ChatInputCommandInteraction, SharedSlashCommandOptions, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandUserOption } from 'discord.js';
import { AnySlashCommandOptionBuilder, AnySlashCommandOptionData, SlashCommandOptionResolvable, SlashCommandSubcommandOptionsOnlyBuilder, SlashCommandSubcommandOptionsOnlyData, SlashCommandSubcommandsOnlyResolvable } from '../../types/slashCommandOptions';
import { BaseInteractionBasedCommandData, CommandType } from '../../types/commands';
import { BaseCommandBuilder, BaseCommandBuilderData } from './BaseCommandBuilder';
import { CommandCooldownData } from '../managers/CommandCooldownManager';
import { CommandHaltData, CommandHaltReason } from '../../types/halt';
import { botHasPermissionsToExecute } from '../../utils/permissions';
import { RecipleClient } from '../RecipleClient';
import { Mixin } from 'ts-mixer';
import { isSlashCommandOption } from '../../utils/functions';

export interface SlashCommandExecuteData {
    /**
     * Command type
     */
    commandType: CommandType.SlashCommand;
    /**
     * Current bot client
     */
    client: RecipleClient;
    /**
     * Command interaction
     */
    interaction: ChatInputCommandInteraction;
    /**
     * Command builder
     */
    builder: AnySlashCommandBuilder;
}

export type SlashCommandHaltData = CommandHaltData<CommandType.SlashCommand>;

export type SlashCommandExecuteFunction = (executeData: SlashCommandExecuteData) => Awaitable<void>;
export type SlashCommandHaltFunction = (haltData: SlashCommandHaltData) => Awaitable<boolean>;

export type SlashCommandResolvable = AnySlashCommandBuilder|SlashCommandData;
export type AnySlashCommandBuilder = SlashCommandSubcommandsOnlyBuilder|SlashCommandOptionsOnlyBuilder|SlashCommandBuilder;
export type SlashCommandSubcommandsOnlyBuilder = Omit<SlashCommandBuilder, 'addBooleanOption' | 'addUserOption' | 'addChannelOption' | 'addRoleOption' | 'addAttachmentOption' | 'addMentionableOption' | 'addStringOption' | 'addIntegerOption' | 'addNumberOption'>;
export type SlashCommandOptionsOnlyBuilder = Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export interface SlashCommandData extends BaseCommandBuilderData, BaseInteractionBasedCommandData<true> {
    commandType: CommandType.SlashCommand;
    halt?: SlashCommandHaltFunction;
    execute?: SlashCommandExecuteFunction;
    options?: SlashCommandOptionResolvable[]|SlashCommandSubcommandsOnlyResolvable[];
}

export interface SlashCommandBuilder extends discordjs.SlashCommandBuilder, BaseCommandBuilder {
    halt?: SlashCommandHaltFunction;
    execute?: SlashCommandExecuteFunction;

    setHalt(halt?: SlashCommandHaltFunction|null): this;
    setExecute(execute?: SlashCommandExecuteFunction|null): this;

    addSubcommandGroup(input: SlashCommandSubcommandGroupBuilder | ((subcommandGroup: SlashCommandSubcommandGroupBuilder) => SlashCommandSubcommandGroupBuilder)): SlashCommandSubcommandsOnlyBuilder;
    addSubcommand(input: SlashCommandSubcommandBuilder | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder)): SlashCommandSubcommandsOnlyBuilder;

    addBooleanOption(input: SlashCommandBooleanOption | ((builder: SlashCommandBooleanOption) => SlashCommandBooleanOption)): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addUserOption(input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption)): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addChannelOption(input: SlashCommandChannelOption | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption)): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addRoleOption(input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption)): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addAttachmentOption(input: SlashCommandAttachmentOption | ((builder: SlashCommandAttachmentOption) => SlashCommandAttachmentOption)): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addMentionableOption(input: SlashCommandMentionableOption | ((builder: SlashCommandMentionableOption) => SlashCommandMentionableOption)): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addStringOption(
        input:
            | SlashCommandStringOption
            | Omit<SlashCommandStringOption, 'setAutocomplete'>
            | Omit<SlashCommandStringOption, 'addChoices'>
            | ((builder: SlashCommandStringOption) => SlashCommandStringOption | Omit<SlashCommandStringOption, 'setAutocomplete'> | Omit<SlashCommandStringOption, 'addChoices'>)
    ): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addIntegerOption(
        input:
            | SlashCommandIntegerOption
            | Omit<SlashCommandIntegerOption, 'setAutocomplete'>
            | Omit<SlashCommandIntegerOption, 'addChoices'>
            | ((builder: SlashCommandIntegerOption) => SlashCommandIntegerOption | Omit<SlashCommandIntegerOption, 'setAutocomplete'> | Omit<SlashCommandIntegerOption, 'addChoices'>)
    ): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
    addNumberOption(
        input:
            | SlashCommandNumberOption
            | Omit<SlashCommandNumberOption, 'setAutocomplete'>
            | Omit<SlashCommandNumberOption, 'addChoices'>
            | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption | Omit<SlashCommandNumberOption, 'setAutocomplete'> | Omit<SlashCommandNumberOption, 'addChoices'>)
    ): Omit<this, 'addSubcommand' | 'addSubcommandGroup'>;
}

export class SlashCommandBuilder extends Mixin(discordjs.SlashCommandBuilder, BaseCommandBuilder) {
    readonly commandType: CommandType.SlashCommand = CommandType.SlashCommand;

    constructor(data?: Omit<Partial<SlashCommandData>, 'commandType'>) {
        super(data);

        if (data?.name !== undefined) this.setName(data.name);
        if (data?.nameLocalizations !== undefined) this.setNameLocalizations(data.nameLocalizations);
        if (data?.description !== undefined) this.setDescription(data.description);
        if (data?.descriptionLocalizations !== undefined) this.setDescriptionLocalizations(data.descriptionLocalizations);
        if (data?.requiredMemberPermissions !== undefined || data?.defaultMemberPermissions !== undefined) this.setRequiredMemberPermissions(data?.requiredMemberPermissions ?? data?.defaultMemberPermissions);
        if (data?.dmPermission !== undefined) this.setDMPermission(data.dmPermission);
        if (data?.defaultPermission !== undefined) this.setDefaultPermission(data.defaultPermission);
        if (data?.requiredBotPermissions !== undefined) this.setRequiredBotPermissions(data.requiredBotPermissions);
        if (data?.options) {
            for (const option of data.options) {
                SlashCommandBuilder.addOption(this, isSlashCommandOption(option) ? option : SlashCommandBuilder.resolveOption(option));
            }
        }
    }

    public setRequiredMemberPermissions(permissions?: discordjs.PermissionResolvable | null | undefined): this {
        super.setRequiredMemberPermissions(permissions);
        this.setDefaultMemberPermissions(this.requiredMemberPermissions);
        return this;
    }

    public static addOption<Builder extends SharedSlashCommandOptions>(builder: Builder, option: AnySlashCommandOptionBuilder|SlashCommandSubcommandOptionsOnlyBuilder): Builder {
        if (option instanceof SlashCommandAttachmentOption) {
            builder.addAttachmentOption(option);
        } else if (option instanceof SlashCommandBooleanOption) {
            builder.addBooleanOption(option);
        } else if (option instanceof SlashCommandChannelOption) {
            builder.addChannelOption(option);
        } else if (option instanceof SlashCommandIntegerOption) {
            builder.addIntegerOption(option);
        } else if (option instanceof SlashCommandMentionableOption) {
            builder.addMentionableOption(option);
        } else if (option instanceof SlashCommandNumberOption) {
            builder.addNumberOption(option);
        } else if (option instanceof SlashCommandRoleOption) {
            builder.addRoleOption(option);
        } else if (option instanceof SlashCommandStringOption) {
            builder.addStringOption(option);
        } else if (option instanceof SlashCommandUserOption) {
            builder.addUserOption(option);
        } else if (builder instanceof SlashCommandBuilder) {
            if (option instanceof SlashCommandSubcommandBuilder) {
                builder.addSubcommand(option);
            } else if (option instanceof SlashCommandSubcommandGroupBuilder) {
                builder.addSubcommandGroup(option);
            }
        }

        return builder;
    }

    public static resolveOption<T extends AnySlashCommandOptionBuilder|SlashCommandSubcommandOptionsOnlyBuilder>(option: AnySlashCommandOptionData|SlashCommandSubcommandOptionsOnlyData): T {
        let builder: AnySlashCommandOptionBuilder|SlashCommandSubcommandOptionsOnlyBuilder;

        // TODO: I can do better than this

        switch (option.type) {
            case ApplicationCommandOptionType.Attachment:
                builder = new SlashCommandAttachmentOption();
                break;
            case ApplicationCommandOptionType.Boolean:
                builder = new SlashCommandBooleanOption();
                break;
            case ApplicationCommandOptionType.Channel:
                builder = new SlashCommandChannelOption().addChannelTypes(...(option.channelTypes ?? []));
                break;
            case ApplicationCommandOptionType.Integer:
                builder = new SlashCommandIntegerOption().addChoices(...(option.choices ?? [])).setAutocomplete(!!option.autocomplete);

                if (option.maxValue) builder.setMaxValue(option.maxValue);
                if (option.minValue) builder.setMinValue(option.minValue);

                break;
            case ApplicationCommandOptionType.Mentionable:
                builder = new SlashCommandMentionableOption();
                break;
            case ApplicationCommandOptionType.Number:
                builder = new SlashCommandNumberOption().addChoices(...(option.choices ?? [])).setAutocomplete(!!option.autocomplete);

                if (option.maxValue) builder.setMaxValue(option.maxValue);
                if (option.minValue) builder.setMinValue(option.minValue);

                break;
            case ApplicationCommandOptionType.Role:
                builder = new SlashCommandRoleOption();
                break;
            case ApplicationCommandOptionType.String:
                builder = new SlashCommandStringOption().addChoices(...(option.choices ?? [])).setAutocomplete(!!option.autocomplete);

                if (option.maxLength) builder.setMaxLength(option.maxLength);
                if (option.minLength) builder.setMinLength(option.minLength);

                break;
            case ApplicationCommandOptionType.User:
                builder = new SlashCommandUserOption();
                break;
            case ApplicationCommandOptionType.Subcommand:
                builder = new SlashCommandSubcommandBuilder();

                for (const optionData of option.options ?? []) {
                    this.addOption(builder, this.resolveOption<AnySlashCommandOptionBuilder>(optionData));
                }

                break;
            case ApplicationCommandOptionType.SubcommandGroup:
                builder = new SlashCommandSubcommandGroupBuilder();

                for (const subCommandData of option.options) {
                    builder.addSubcommand(subCommandData instanceof SlashCommandSubcommandBuilder ? subCommandData : this.resolveOption<SlashCommandSubcommandBuilder>(subCommandData));
                }

                break;
            default:
                throw new TypeError('Unknown option data');
        }

        if (!(builder instanceof SlashCommandSubcommandBuilder) && !(builder instanceof SlashCommandSubcommandGroupBuilder) && option.type !== ApplicationCommandOptionType.Subcommand && option.type !== ApplicationCommandOptionType.SubcommandGroup) {
            builder.setRequired(option.required ?? false);
        }

        return builder
            .setName(option.name)
            .setDescription(option.description)
            .setNameLocalizations(option.nameLocalizations ?? null)
            .setDescriptionLocalizations(option.descriptionLocalizations ?? null) as T;
    }

    public static resolve(slashCommandResolvable: SlashCommandResolvable): AnySlashCommandBuilder {
        return this.isSlashCommandBuilder(slashCommandResolvable) ? slashCommandResolvable : new SlashCommandBuilder(slashCommandResolvable);
    }

    public static isSlashCommandBuilder<T extends AnySlashCommandBuilder = AnySlashCommandBuilder>(data: any): data is T {
        return data instanceof SlashCommandBuilder;
    }

    public static async execute(client: RecipleClient, interaction: ChatInputCommandInteraction): Promise<SlashCommandExecuteData|undefined> {
        if (client.config?.commands?.slashCommand?.enabled === false) return;
        if (client.config?.commands?.slashCommand?.acceptRepliedInteractions === false && (interaction.replied || interaction.deferred)) return;

        const builder = client.commands.get(interaction.commandName, CommandType.SlashCommand);
        if (!builder) return;

        const executeData: SlashCommandExecuteData = {
            builder,
            commandType: builder.commandType,
            interaction,
            client
        };

        if (client.config.commands?.slashCommand?.enableCooldown !== false && builder.cooldown) {
            const cooldownData: Omit<CommandCooldownData, 'endsAt'> = {
                command: builder.name,
                user: interaction.user,
                type: builder.commandType
            };

            if (!client.cooldowns.isCooledDown(cooldownData)) {
                client.cooldowns.add({ ...cooldownData, endsAt: new Date(Date.now() + builder.cooldown) });
            } else {
                await client._haltCommand(builder, {
                    commandType: builder.commandType,
                    reason: CommandHaltReason.Cooldown,
                    cooldownData: client.cooldowns.get(cooldownData)!,
                    executeData
                });
                return;
            }
        }

        if (builder.requiredBotPermissions !== undefined && interaction.inGuild()) {
            const isBotExecuteAllowed = botHasPermissionsToExecute((interaction.channel || interaction.guild)!, builder.requiredBotPermissions);
            if (!isBotExecuteAllowed) {
                await client._haltCommand(builder, {
                    commandType: builder.commandType,
                    reason: CommandHaltReason.MissingBotPermissions,
                    executeData
                });
                return;
            }
        }

        return (await client._executeCommand(builder, executeData)) ? executeData : undefined;
    }
}
