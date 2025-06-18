import { IClientBase } from '../common';
import { IConfiguration } from './interfaces';
import { Client } from '@twitchapis/twitch.js';

export class TwitchClient extends Client implements IClientBase {
  private configuration: IConfiguration;

  constructor(options: IConfiguration) {
    super(options);

    this.configuration = options;
  }

  public getConfiguration(): IConfiguration {
    return this.configuration;
  }

  public getRawClient(): Client {
    return (this as Client);
  }
}

export * from '@twitchapis/twitch.js';
