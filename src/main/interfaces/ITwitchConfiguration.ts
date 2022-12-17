import { Interfaces } from '@twitchapis/twitch.js';

export interface ITwitchConfiguration extends Interfaces.IClientOptions {
    token: string;
}
