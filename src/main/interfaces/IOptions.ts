import { ApplicationCommandOption, ApplicationCommandPermissions, ApplicationCommandType } from 'discord.js';
import { DiscordClient } from '../discord';

export interface ICommandManagerOptions {
  client: DiscordClient;
  prefix?: string;
  allowLegacyCommands?: boolean;
  allowSlashCommands?: boolean;
}

export interface ILocalizationBase {
  [key: string]: string;
}

export interface ICommandParameter {
  name: string;
  description: string;
  name_localizations?: ILocalizationBase;
  description_localizations?: ILocalizationBase;
  type: ApplicationCommandOption;
  required: boolean;
  [key: symbol]: ICommandParameter;
  [key: string]: any;
}

export interface ICommandOptions {
  description: string;
  name_localizations: ILocalizationBase;
  description_localizations: ILocalizationBase;
  isLegacyCommand: boolean;
  isSlashCommand: boolean;
  allowDM: boolean;
  command: () => void;
  guildID?: string;
  aliases?: string[];
  parameters?: ICommandParameter[];
  permissions?: ApplicationCommandPermissions[];
  type?: ApplicationCommandType;
}

export interface IAsyncCommandOptions extends ICommandOptions {
  command: () => Promise<void>;
}
