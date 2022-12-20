import {
  CommandInteraction,
  DMChannel,
  Guild,
  GuildMember,
  InteractionResponse,
  Message,
  NewsChannel,
  PartialDMChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  TextChannel,
  User,
  VoiceChannel,
} from 'discord.js';
import { DiscordClient } from '../Discord/';

export interface IDiscordCommandContext {
  client: DiscordClient;
  reply: (content: string | any) => Promise<void> | Promise<InteractionResponse<boolean>>;
  discreteReply: (content: string | any) => Promise<void> | Promise<InteractionResponse<boolean>>;
  args: (string | number | boolean)[];
  author: User;
  member?: GuildMember;
  guild?: Guild;
  channel?: DMChannel | PartialDMChannel | NewsChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel;
  interaction?: CommandInteraction;
  message?: Message;
  [key: symbol]: any;
}
