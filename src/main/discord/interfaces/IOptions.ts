import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  APIApplicationCommandOptionChoice,
  CategoryChannelType,
  PermissionResolvable,
  InteractionContextType,
} from 'discord.js';

import { ICommandContext, DiscordClient } from '..';
import { ICommandOptionsBase } from '../../common';
import { Logger } from '@promisepending/logger.js';

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
  permissions?: PermissionResolvable[];
}

export interface IAsyncCommandOptions extends ICommandOptions {
  command?: (context: ICommandContext) => Promise<void>;
}

export interface StructuredCommand {
  name: string;
  type: ApplicationCommandType;
  description: string;
  /** @deprecated The `dm_permission` property is deprecated by Discord, and will be removed in a future version. Use `contexts` instead. */
  dm_permission?: boolean;
  nfsw: boolean;
  contexts: InteractionContextType[]
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
  options?: ICommandParameter[];
  guild_id?: string;
  default_member_permissions?: bigint | null;
}
