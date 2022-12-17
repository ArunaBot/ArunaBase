import { ClientOptions } from 'discord.js';

export interface IDiscordConfiguration extends ClientOptions {
  botID?: string,
  token?: string
}

export interface ICommandGuildScope {
  guildID: string;
  commandName: string;
}
