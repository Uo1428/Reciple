import { ApplicationCommandBuilder } from '../registerApplicationCommands';
import { ApplicationCommandData, PermissionsBitField } from 'discord.js';
import { ConfigCommandPermissions } from '../classes/RecipleConfig';
import { RecipleModule, RecipleScript } from '../modules';
import { RecipleClient } from '../classes/RecipleClient';
import { AnyCommandBuilder } from './builders';

export interface RecipleClientAddModuleOptions {
    /**
     * The module script
     */
    script: RecipleScript;
    /**
     * Register application commands if possible
     */
    registerApplicationCommands?: boolean;
    /**
     * Module optional info
     */
    moduleInfo?: RecipleModule["info"];
}

export interface RegisterApplicationCommandsOptions {
    /**
     * Bot client
     */
    client: RecipleClient;
    /**
     * Commands to register
     */
    commands: (ApplicationCommandData|ApplicationCommandBuilder)[];
    /**
     * Set guild to not register commands globally
     */
    guilds?: string|string[];
}

export interface UserHasCommandPermissionsOptions {
    /**
     * Command builder
     */
    builder: AnyCommandBuilder;
    /**
     * Member permissions
     */
    memberPermissions?: PermissionsBitField;
    /***
     * Required command config permissions
     */
    commandPermissions?: { enabled: boolean; commands: ConfigCommandPermissions[]; };
}
