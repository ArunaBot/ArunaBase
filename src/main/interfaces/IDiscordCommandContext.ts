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
  StageChannel,
  TextChannel,
  User,
  VoiceChannel,
} from 'discord.js';
import { DiscordClient } from '../discord';

export interface IDiscordCommandContext {
  client: DiscordClient;
  reply: (content: string | any) => Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  editReply: (content: string | any) => Promise<Message<boolean>> | Promise<Message<BooleanCache<any>>>;
  discreteReply: (content: string | any) => Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  messageReplyContent?: any,
  args: (string | number | boolean | User | undefined)[];
  author: User;
  member?: GuildMember | null;
  guild?: Guild | null;
  channel?: DMChannel | PartialDMChannel | NewsChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | StageChannel | null;
  interaction?: CommandInteraction;
  message?: Message;
  [key: symbol]: any;
}
