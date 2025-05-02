import { ApplicationCommandOptionType, ApplicationCommandType, APIApplicationCommandOptionChoice, CategoryChannelType } from 'discord.js';
import { IDiscordCommandContext } from './IDiscordCommandContext';
import { Logger } from '@promisepending/logger.js';
import { DiscordClient } from '../discord';

export interface ICommandManagerOptions {
  client: DiscordClient;
  logger: Logger;
  additionalContext?: { [key: symbol]: any };
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
  required?: boolean;
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
  command?: (context: IDiscordCommandContext) => void;
  aliases?: string[];
  parameters?: ICommandParameter[];
  type?: ApplicationCommandType;
  nsfw?: boolean;
}

export interface IAsyncCommandOptions extends ICommandOptions {
  command?: (context: IDiscordCommandContext) => Promise<void>;
}

export interface StructuredCommand {
  name: string;
  type: ApplicationCommandType;
  description: string;
  dm_permission: boolean;
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
  options?: ICommandParameter[];
  guild_id?: string;
}
