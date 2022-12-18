import { ClientOptions } from 'discord.js';

export interface IDiscordConfiguration extends ClientOptions {
  botID?: string,
  token?: string,
  prefix?: string,
  allowSlashCommands?: boolean,
  allowLegacyCommands?: boolean,
}

export interface ICommandGuildScope {
  guildID: string;
  commandName: string;
}
