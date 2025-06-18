import { Interfaces } from '@twitchapis/twitch.js';

export interface IConfiguration extends Interfaces.IClientOptions {
  token: string;
}
