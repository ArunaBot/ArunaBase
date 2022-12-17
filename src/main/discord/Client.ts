import { Client as DJSClient } from 'discord.js';
import { IDiscordConfiguration } from '../interfaces';

export class DiscordClient extends DJSClient {
  private configuration: IDiscordConfiguration;

  constructor(options: IDiscordConfiguration) {
    super(options);

    this.configuration = options;
  }

  public getConfiguration(): IDiscordConfiguration {
    return this.configuration;
  }

  public getRawClient(): DJSClient {
    return (this as DJSClient);
  }
}

export * as DJS from 'discord.js';
