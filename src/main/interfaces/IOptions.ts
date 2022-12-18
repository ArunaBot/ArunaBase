import { ApplicationCommandOptionType, ApplicationCommandPermissions, ApplicationCommandType, APIApplicationCommandOptionChoice, CategoryChannelType } from 'discord.js';
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
  type: ApplicationCommandOptionType;
  required: boolean;
  choices?: APIApplicationCommandOptionChoice[];
  options?: ICommandParameter[];
  channel_types?: CategoryChannelType[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  autocomplete?: boolean;
}

export interface ICommandOptions {
  description?: string;
  name_localizations?: ILocalizationBase;
  description_localizations?: ILocalizationBase;
  isLegacyCommand?: boolean;
  isSlashCommand?: boolean;
  allowDM?: boolean;
  command: () => void;
  guildID?: string;
  aliases?: string[];
  parameters?: ICommandParameter[];
  permissions?: ApplicationCommandPermissions[];
  type?: ApplicationCommandType;
  nsfw?: boolean;
}

export interface IAsyncCommandOptions extends ICommandOptions {
  command: () => Promise<void>;
}
