import { AsyncCommandStructure, CommandStructure, CommandStructureBased } from '../structures';
import { Events, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { MessageHandler, SlashHandler } from './handlers';
import { ICommandContext } from '../interfaces';
import { CommandManager } from '../managers';
import { DiscordClient } from '../Client';

export type MsgParams = string | EmbedBuilder | AttachmentBuilder;

export class CommandListener {
  constructor(
    private manager: CommandManager,
    private client: DiscordClient,
    enableLegacy: boolean,
    enableSlash: boolean,
    private additionalContext: { [key: symbol | string]: any } = {},
  ) {
    if (enableLegacy) {
      this.client.on(Events.MessageCreate, (msg) => 
        new MessageHandler(this.manager, this.client, this).run(msg).catch((err) => this.client.getLogger().error(`CommandListener: Error in MessageHandler: ${err}`)),
      );
    }
    if (enableSlash) {
      this.client.on(Events.InteractionCreate, (ctx) => 
        new SlashHandler(this.manager, this.client, this).run(ctx).catch((err) => this.client.getLogger().error(`CommandListener: Error in SlashHandler: ${err}`)),
      );
    }
  }

  public replyParser(...params: MsgParams[]): { content?: string, embeds?: EmbedBuilder[], files?: AttachmentBuilder[] } {
    const result: { content?: string, embeds?: EmbedBuilder[], files?: AttachmentBuilder[] } = {
      content: '',
      embeds: [],
      files: [],
    };

    for (const item of params) {
      if (typeof item === 'string') {
        result.content += item;
      } else if (item instanceof EmbedBuilder) {
        result.embeds!.push(item);
      } else if (item instanceof AttachmentBuilder) {
        result.files!.push(item);
      } else {
        throw new Error('Invalid parameter type!');
      }
    }

    return result;
  }

  public async executeCommand(commandInput: string | CommandStructureBased, context: ICommandContext, isDM = false): Promise<void> {
    context = { ...context, ...this.additionalContext };
    
    let command: CommandStructureBased | null = null;

    if (typeof commandInput === 'string') {
      command = this.manager.getCommand(commandInput);
    } else command = commandInput;

    if (!command) return Promise.resolve();
    if (!command.isDMAllowed() && isDM) return Promise.resolve();
    try {
      if (!command.checkPermission(context)) return Promise.resolve();
      if (command.isAsyncCommand()) {
        const asyncCommand = command as AsyncCommandStructure;
        await asyncCommand.run(context);
        return Promise.resolve();
      } else {
        const syncCommand = command as CommandStructure;
        syncCommand.run(context);
        return Promise.resolve();
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
