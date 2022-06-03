import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, PermissionFlags, PermissionString } from 'discord.js';
import { RecipleClient } from '../Client';

export interface RecipleInteractionCommandExecute {
    interaction: CommandInteraction;
    command: InteractionCommandBuilder;
    builder: InteractionCommandBuilder;
    client: RecipleClient;
}

export class InteractionCommandBuilder extends SlashCommandBuilder {
    public readonly builder: string = 'INTERACTION_COMMAND';
    public requiredPermissions: (PermissionFlags|PermissionString)[] = [];
    public allowExecuteInDM: boolean = true;
    public execute: (options: RecipleInteractionCommandExecute) => void = (options) => { /* Execute */ };
    
    public setRequiredPermissions(requiredPermissions: (keyof PermissionFlags)[]): InteractionCommandBuilder {
        if (!requiredPermissions || !Array.isArray(requiredPermissions)) throw new Error('requiredPermissions must be an array.');
        this.requiredPermissions = requiredPermissions;
        return this;
    }

    public setAllowExecuteInDM(allowExecuteInDM: boolean): InteractionCommandBuilder {
        if (typeof allowExecuteInDM !== 'boolean') throw new Error('allowExecuteInDM must be a boolean.');
        this.allowExecuteInDM = allowExecuteInDM;
        return this;
    }

    public setExecute(execute: (options: RecipleInteractionCommandExecute) => void): InteractionCommandBuilder {
        if (!execute || typeof execute !== 'function') throw new Error('execute must be a function.');
        this.execute = execute;
        return this;
    }
}
