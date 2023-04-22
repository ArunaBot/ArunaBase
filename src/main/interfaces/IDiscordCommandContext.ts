import {
  BooleanCache,
  CommandInteraction,
  DMChannel,
  EmbedBuilder,
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
  reply: (...content: [string | EmbedBuilder]) => Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  editReply: (...content: [string | EmbedBuilder]) => Promise<Message<boolean>> | Promise<Message<BooleanCache<any>>>;
  discreteReply: (...content: [string | EmbedBuilder]) => Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  deleteReply: () => Promise<void | Message<boolean>>;
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
