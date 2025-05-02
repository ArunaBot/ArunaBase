import { 
  Interaction,
  Message,
  GuildMember,
  InteractionResponse,
  BooleanCache,
  ChannelType,
  DiscordAPIError,
  TextChannel,
  Events,
  MessageFlags,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { AsyncCommandStructure, CommandStructure, MessageStructure } from '../structures';
import { IDiscordCommandContext } from '../../interfaces';
import { DiscordClient } from '../Client';
import { ButtonManager, CommandManager } from '../managers';

type MsgParams = string | EmbedBuilder | AttachmentBuilder;

export class CommandListener {
  constructor(
    private manager: CommandManager,
    private client: DiscordClient,
    enableLegacy: boolean,
    enableSlash: boolean,
    private additionalContext: { [key: symbol | string]: any } = {},
  ) {
    if (enableLegacy) this.client.on(Events.MessageCreate, this.onMessage.bind(this));
    if (enableSlash) this.client.on(Events.InteractionCreate, this.onInteractionCreate.bind(this));
  }

  private async onMessage(message: Message): Promise<void> {
    if (message.author.bot || !message.content) return;
    
    const customFound = this.manager.getCustomPrefixes().find((customPrefix) => customPrefix.testMessage(message));
    const prefix = customFound ? customFound.getPrefix() : this.manager.getPrefix();

    if (!prefix || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const context: IDiscordCommandContext = {
      client: this.client,
      guild: message.guild,
      channel: message.channel,
      member: message.member,
      author: message.author,
      messageReplyContent: null,
      reply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<boolean>> => {
        return new Promise(async (resolve, reject) => {
          const parsedContent = (options.length === 1 && options[0] instanceof MessageStructure) ? options[0].toDiscordMessage() : this.replyParser(...options as MsgParams[]);
          message.reply({
            ...parsedContent,
            failIfNotExists: false,
          }).then((result) => {
            context.messageReplyContent = result;
            if (options[0] instanceof MessageStructure) ButtonManager.getInstance().registerButtons(options[0].getButtons());
            return resolve(result);
          }).catch((error: DiscordAPIError) => {
            // 50035: Cannot send messages to this user
            if (error.code !== 50035) return reject(error);
            (message.channel as TextChannel).send(parsedContent).then((result) => {
              context.messageReplyContent = result;
              return resolve(result);
            }).catch((reason) => { return reject(reason); });
          });
        });
      },
      editReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) {
          if (context.messageReplyContent?.editable) return context.messageReplyContent.edit(options[0]);
          return (context.reply(options[0]) as Promise<Message<boolean>>);
        }

        if (context.messageReplyContent?.editable) return context.messageReplyContent.edit(this.replyParser(...(options as MsgParams[])));
        return (context.reply(...(options as MsgParams[])) as Promise<Message<boolean>>);
      },
      discreteReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<boolean>> => {
        return new Promise(async (resolve, reject) => {
          const parsedContent = (options.length === 1 && options[0] instanceof MessageStructure) ? options[0].toDiscordMessage() : this.replyParser(...options as MsgParams[]);
          message.reply({
            ...parsedContent,
            allowedMentions: { repliedUser: false },
            failIfNotExists: false,
          }).then((result) => {
            context.messageReplyContent = result;
            if (options[0] instanceof MessageStructure) ButtonManager.getInstance().registerButtons(options[0].getButtons());
            return resolve(result);
          }).catch((error: DiscordAPIError) => {
            // 50035: Cannot send messages to this user
            if (error.code !== 50035) return reject(error);
            (message.channel as TextChannel).send(parsedContent).then((result) => {
              context.messageReplyContent = result;
              return resolve(result);
            }).catch((reason) => { return reject(reason); });
          });
        });
      },
      deleteReply: async (): Promise<void | Message<boolean>> => {
        if (!context.messageReplyContent?.deletable) return Promise.resolve();
        return context.messageReplyContent.delete();
      },
      deferReply: async (): Promise<void> => {
        return (message.channel as TextChannel).sendTyping();
      },
      args,
      message,
    };
    await this.executeCommand(commandName, context, (message.channel.type === ChannelType.DM)).catch((error) => {
      this.client.getLogger().error(`An error occurred while execute command ${commandName}.\nError:`, error);
    });
  }

  private async onInteractionCreate(ctx: Interaction): Promise<void> {
    if (!ctx.isCommand()) return;

    const context: IDiscordCommandContext = {
      client: this.client,
      guild: ctx.guild,
      channel: ctx.channel,
      member: ctx.member as GuildMember,
      author: ctx.user,
      args: ctx.options.data.map((arg) => arg.value),
      reply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<BooleanCache<any>> | InteractionResponse<boolean>> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) return await ctx.reply(options[0]);
        return await ctx.reply(this.replyParser(...(options as MsgParams[])));
      },
      editReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<BooleanCache<any>>> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) return await ctx.editReply(options[0]);
        return await ctx.editReply(this.replyParser(...(options as MsgParams[])));
      },
      discreteReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<BooleanCache<any>>> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) {
          return await ctx.reply({ ...options[0].toDiscordMessage(), flags: MessageFlags.Ephemeral }).then((result) => {
            ButtonManager.getInstance().registerButtons((options[0] as MessageStructure).getButtons());
            return result;
          });
        };
        return await ctx.reply({ ...this.replyParser(...(options as MsgParams[])), flags: MessageFlags.Ephemeral });
      },
      deleteReply: async (): Promise<void> => {
        return ctx.deleteReply();
      },
      deferReply: async (ephemeral = false): Promise<InteractionResponse<boolean>> => {
        return ctx.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
      },
      interaction: ctx,
    };

    await this.executeCommand(ctx.commandName, context).catch((error) => {
      const errorMessage = `An error occurred while execute command ${ctx.commandName}.`;
      if (!ctx.replied && !ctx.deferred) {
        ctx.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch();
      } else if (ctx.deferred) {
        ctx.editReply({ content: errorMessage }).catch();
      }
      this.client.getLogger().error(`${errorMessage}\nError:`, error);
    });
  }

  private replyParser(...params: MsgParams[]): { content?: string, embeds?: EmbedBuilder[], files?: AttachmentBuilder[] } {
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

  private async executeCommand(commandName: string, context: IDiscordCommandContext, isDM = false): Promise<void> {
    context = { ...context, ...this.additionalContext };
    const command = this.manager.getCommand(commandName);
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
