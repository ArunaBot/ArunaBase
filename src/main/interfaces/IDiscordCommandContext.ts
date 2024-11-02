import {
  AttachmentBuilder,
  BooleanCache,
  CommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  InteractionResponse,
  Message,
  TextBasedChannel,
  User,
} from 'discord.js';
import { DiscordClient } from '../discord';

export interface IDiscordCommandContext {
  client: DiscordClient;
  reply: (...content: (string | EmbedBuilder | AttachmentBuilder)[]) => Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  editReply: (...content: (string | EmbedBuilder | AttachmentBuilder)[]) => Promise<Message<boolean>> | Promise<Message<BooleanCache<any>>>;
  discreteReply: (...content: (string | EmbedBuilder | AttachmentBuilder)[]) => Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  deleteReply: () => Promise<void | Message<boolean>>;
  messageReplyContent?: any,
  args: (string | number | boolean | User | undefined)[];
  author: User;
  member?: GuildMember | null;
  guild?: Guild | null;
  channel?: GuildTextBasedChannel | TextBasedChannel | null;
  interaction?: CommandInteraction;
  message?: Message;
  [key: symbol]: any;
}
