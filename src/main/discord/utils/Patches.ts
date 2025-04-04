import {
  Message,
  BaseGuildTextChannel,
  MessagePayload,
  InteractionReplyOptions,
  MessageReplyOptions,
  OmitPartialGroupDMChannel,
  MessageEditOptions,
  CommandInteraction,
  InteractionEditReplyOptions,
  BooleanCache,
} from 'discord.js';
import { MessageStructure } from '../structures';
import { ButtonManager } from '../managers';

declare module 'discord.js' {
  interface BaseGuildTextChannel {
    _send(options: string | MessagePayload | InteractionReplyOptions): Promise<Message>;
    send(options: string | MessagePayload | InteractionReplyOptions | MessageStructure): Promise<Message>;
  }

  interface Message {
    _reply(options: string | MessagePayload | MessageReplyOptions): Promise<OmitPartialGroupDMChannel<Message<any>>>;
    reply(options: string | MessagePayload | MessageReplyOptions | MessageStructure): Promise<OmitPartialGroupDMChannel<Message<any>>>;

    _edit(options: string | MessagePayload | MessageEditOptions): Promise<OmitPartialGroupDMChannel<Message<any>>>;
    edit(options: string | MessagePayload | MessageEditOptions | MessageStructure): Promise<OmitPartialGroupDMChannel<Message<any>>>;
  }

  interface CommandInteraction {
    _reply(options: string | MessagePayload | InteractionReplyOptions): Promise<Message<BooleanCache<any>>>;
    reply(options: string | MessagePayload | InteractionReplyOptions | MessageStructure): Promise<Message<BooleanCache<any>>>;

    _editReply(options: string | MessagePayload | InteractionEditReplyOptions): Promise<Message<BooleanCache<any>>>;
    editReply(options: string | MessagePayload | InteractionEditReplyOptions | MessageStructure): Promise<Message<BooleanCache<any>>>;
  }
}

BaseGuildTextChannel.prototype._send = BaseGuildTextChannel.prototype.send;

BaseGuildTextChannel.prototype.send = async function (options: string | MessagePayload | InteractionReplyOptions | MessageStructure): Promise<Message> {
  if (options instanceof MessageStructure) {
    ButtonManager.getInstance().registerButtons(options.getButtons());
    return this._send(options.toDiscordMessage());
  }
  return this._send(options);
};

Message.prototype._reply = Message.prototype.reply;

Message.prototype.reply = async function (options: string | MessagePayload | MessageReplyOptions | MessageStructure): Promise<OmitPartialGroupDMChannel<Message<any>>> {
  if (options instanceof MessageStructure) {
    ButtonManager.getInstance().registerButtons(options.getButtons());
    return this._reply(options.toDiscordMessage());
  }
  return this._reply(options);
};

Message.prototype._edit = Message.prototype.edit;

Message.prototype.edit = async function (options: string | MessagePayload | MessageEditOptions | MessageStructure): Promise<OmitPartialGroupDMChannel<Message<any>>> {
  if (options instanceof MessageStructure) {
    ButtonManager.getInstance().registerButtons(options.getButtons());
    return this._edit(options.toDiscordMessage());
  }
  return this._edit(options);
};

CommandInteraction.prototype._reply = CommandInteraction.prototype.reply;

// @ts-expect-error - This override the original reply method, wich is preserved in _reply
CommandInteraction.prototype.reply =
  async function (options: string | MessagePayload | InteractionReplyOptions | MessageStructure): Promise<Message<BooleanCache<any>>> {
    if (options instanceof MessageStructure) {
      ButtonManager.getInstance().registerButtons(options.getButtons());
      return this._reply(options.toDiscordMessage());
    }
    return this._reply(options);
  };

CommandInteraction.prototype._editReply = CommandInteraction.prototype.editReply;

CommandInteraction.prototype.editReply =
  async function (options: string | MessagePayload | InteractionEditReplyOptions | MessageStructure): Promise<Message<BooleanCache<any>>> {
    if (options instanceof MessageStructure) {
      ButtonManager.getInstance().registerButtons(options.getButtons());
      return this._editReply(options.toDiscordMessage());
    }
    return this._editReply(options);
  };
