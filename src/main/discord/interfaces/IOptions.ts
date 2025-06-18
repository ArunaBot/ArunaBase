import { ApplicationCommandOptionType, ApplicationCommandType, APIApplicationCommandOptionChoice, CategoryChannelType } from 'discord.js';
import { ICommandContext, DiscordClient } from '..';
import { Logger } from '@promisepending/logger.js';
import { ICommandOptionsBase } from '../../common';

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

export interface ICommandOptions extends ICommandOptionsBase {
  name_localizations?: ILocalizationBase;
  description_localizations?: ILocalizationBase;
  isLegacyCommand?: boolean;
  isSlashCommand?: boolean;
  allowDM?: boolean;
  command?: (context: ICommandContext) => void;
  parameters?: ICommandParameter[];
  type?: ApplicationCommandType;
  nsfw?: boolean;
}

export interface IAsyncCommandOptions extends ICommandOptions {
  command?: (context: ICommandContext) => Promise<void>;
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
