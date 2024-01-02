import { ITwitchConfiguration } from '../interfaces';
import { Client } from '@twitchapis/twitch.js';

export class TwitchClient extends Client {
  private configuration: ITwitchConfiguration;

  constructor(options: ITwitchConfiguration) {
    super(options);

    this.configuration = options;
  }

  public getConfiguration(): ITwitchConfiguration {
    return this.configuration;
  }

  public getRawClient(): Client {
    return (this as Client);
  }
}

export * from '@twitchapis/twitch.js';
