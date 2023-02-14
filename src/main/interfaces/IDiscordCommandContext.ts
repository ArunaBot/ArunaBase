import {
  BooleanCache,
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
import { DiscordClient } from '../discord';

export interface IDiscordCommandContext {
  client: DiscordClient;
  reply: (content: string | any) => Promise<void> | Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  editReply: (content: string | any) => Promise<void> | Promise<Message<boolean>> | Promise<Message<BooleanCache<any>>>;
  discreteReply: (content: string | any) => Promise<void> | Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  messageReplyContent?: any,
  args: (string | number | boolean | User)[];
  author: User;
  member?: GuildMember;
  guild?: Guild;
  channel?: DMChannel | PartialDMChannel | NewsChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel;
  interaction?: CommandInteraction;
  message?: Message;
  [key: symbol]: any;
}
