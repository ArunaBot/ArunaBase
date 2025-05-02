import { ClientOptions } from 'discord.js';

export interface IDiscordConfiguration extends ClientOptions {
  botID?: string,
  token?: string,
  prefix?: string,
  shardId?: number,
  allowSlashCommands?: boolean,
  allowLegacyCommands?: boolean,
  additionalCommandContext?: { [key: symbol|string]: any },
}
