import {
  APIInteractionDataResolvedChannel,
  APIRole,
  Attachment,
  AttachmentBuilder,
  BooleanCache,
  CommandInteraction,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  GuildMember,
  GuildTextBasedChannel,
  InteractionResponse,
  Message,
  Role,
  TextBasedChannel,
  User,
} from 'discord.js';
import { DiscordClient, MessageStructure } from '..';

export type MsgArgs = string | number | boolean | User | APIRole | Role | GuildBasedChannel | APIInteractionDataResolvedChannel | Attachment | null | undefined;

export interface ICommandContext {
  client: DiscordClient;

  reply(message: MessageStructure): Promise<Message<boolean> | InteractionResponse<boolean>>;
  reply(...options: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean> | InteractionResponse<boolean>>;

  editReply(message: MessageStructure): Promise<Message<boolean>> | Promise<Message<BooleanCache<any>>>;
  editReply(...options: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean>> | Promise<Message<BooleanCache<any>>>;

  discreteReply(message: MessageStructure): Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;
  discreteReply(...options: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean>> | Promise<InteractionResponse<boolean>>;

  deleteReply: () => Promise<void | Message<boolean>>;
  deferReply: (ephemeral?: boolean) => Promise<void | InteractionResponse<boolean>>;
  messageReplyContent?: Message<boolean> | null,
  args: MsgArgs[];
  author: User;
  member?: GuildMember | null;
  guild?: Guild | null;
  channel?: GuildTextBasedChannel | TextBasedChannel | null;
  interaction?: CommandInteraction;
  message?: Message;
  [key: symbol]: any;
}
