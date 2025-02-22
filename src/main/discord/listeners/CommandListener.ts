import { 
  Interaction, 
  Message,
  GuildMember, 
  InteractionResponse, 
  BooleanCache, 
  EmbedBuilder, 
  ChannelType, 
  DiscordAPIError, 
  AttachmentBuilder, 
  TextChannel,
  Events,
} from 'discord.js';
import { AsyncCommandStructure, CommandStructure } from '../structures';
import { IDiscordCommandContext } from '../../interfaces';
import { DiscordClient } from '../Client';
import { CommandManager } from '../managers';

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
    
    let prefix = this.manager.getPrefix();
    const customFound = this.manager.getCustomPrefixes().find((customPrefix) => customPrefix.testMessage(message));
    if (customFound) {
      prefix = customFound.getPrefix();
    }

    if (!prefix || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase() ?? '';

    try {
      const context: IDiscordCommandContext = {
        client: this.client,
        guild: message.guild,
        channel: message.channel,
        member: message.member,
        author: message.author,
        messageReplyContent: null,
        reply: async (...content: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean>> => {
          return new Promise(async (resolve, reject) => {
            message.reply(this.replyParser(...content)).then((result) => {
              context.messageReplyContent = result;
              return resolve(result);
            }).catch((error: DiscordAPIError) => {
              if (error.code === 10008 || error.code === 50035) {
                (message.channel as TextChannel).send(this.replyParser(...content)).then((result) => {
                  context.messageReplyContent = result;
                  return resolve(result);
                }).catch((reason) => {
                  return reject(reason);
                });
              } else {
                return reject(error);
              }
            });
          });
        },
        editReply: async (...content: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message> => {
          if (context.messageReplyContent && (context.messageReplyContent as Message<boolean>).editable) {
            return (context.messageReplyContent as Message<boolean>).edit(this.replyParser(...content));
          }
          return (context.reply(...content) as Promise<Message<boolean>>);
        },
        discreteReply: async (...content: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean>> => {
          return new Promise(async (resolve, reject) => {
            const parsedContent = this.replyParser(...content);
            message.reply({
              ...parsedContent,
              allowedMentions: {
                repliedUser: false,
              },
            }).then((result) => {
              context.messageReplyContent = result;
              return resolve(result);
            }).catch((error: DiscordAPIError) => {
              // 10008: Unknown Message
              // 50035: Cannot send messages to this user
              if (error.code === 10008 || error.code === 50035) {
                (message.channel as TextChannel).send(this.replyParser(...content)).then((result) => {
                  context.messageReplyContent = result;
                  return resolve(result);
                }).catch((reason) => {
                  return reject(reason);
                });
              } else {
                return reject(error);
              }
            });
          });
        },
        deleteReply: async (): Promise<void | Message<boolean>> => {
          if (!context.messageReplyContent || !(context.messageReplyContent as Message<boolean>)?.deletable) return Promise.resolve();
          return (context.messageReplyContent as Message<boolean>).delete();
        },
        deferReply: async (): Promise<void> => {
          return (message.channel as TextChannel).sendTyping();
        },
        args,
        message,
      };
      const isDM = message.channel.type === ChannelType.DM;
      await this.executeCommand(commandName, context, isDM);
    } catch (error) {
      this.client.getLogger().error('An error ocurred while execute command ' + commandName + '.\nError:', error);
    }
  }

  private async onInteractionCreate(ctx: Interaction): Promise<void> {
    if (!ctx.isCommand()) return;

    const commandName = ctx.commandName;

    try {
      const context: IDiscordCommandContext = {
        client: this.client,
        guild: ctx.guild,
        channel: ctx.channel,
        member: ctx.member as GuildMember,
        author: ctx.user,
        args: ctx.options.data.map((arg) => arg.value),
        reply: async (...content: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<InteractionResponse<boolean>> => {
          return await ctx.reply(this.replyParser(...content));
        },
        editReply: async (...content: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<BooleanCache<any>>> => {
          return await ctx.editReply(this.replyParser(...content));
        },
        discreteReply: async (...content: (string | EmbedBuilder | AttachmentBuilder)[]): Promise<InteractionResponse<boolean>> => {
          return await ctx.reply({ ...this.replyParser(...content), ephemeral: true });
        },
        deleteReply: async (): Promise<void> => {
          return ctx.deleteReply();
        },
        deferReply: async (): Promise<InteractionResponse<boolean>> => {
          return ctx.deferReply();
        },
        interaction: ctx,
      };

      await this.executeCommand(commandName, context);
    } catch (error) {
      const errorMessage = 'An error ocurred while execute command ' + commandName + '.';
      if (!ctx.replied && !ctx.deferred) {
        ctx.reply({ content: errorMessage, ephemeral: true });
      } else if (ctx.deferred) {
        ctx.editReply({ content: errorMessage });
      }
      this.client.getLogger().error(errorMessage + '\nError:', error);
    }
  }

  private replyParser(...params: (string | EmbedBuilder | AttachmentBuilder)[]): { content?: string, embeds?: EmbedBuilder[], files?: AttachmentBuilder[] } {
    const result: { content?: string, embeds?: EmbedBuilder[], files?: AttachmentBuilder[] } = {
      content: '',
      embeds: [],
      files: [],
    };

    params.forEach((item) => {
      if (typeof item === 'string') {
        result.content += item;
      } else if (item instanceof EmbedBuilder) {
        result.embeds!.push(item);
      } else if (item instanceof AttachmentBuilder) {
        result.files!.push(item);
      } else {
        throw new Error('Invalid parameter type!');
      }
    });

    return result;
  }

  private async executeCommand(commandName: string, context: IDiscordCommandContext, isDM = false): Promise<void> {
    context = { ...context, ...this.additionalContext };
    const command = this.manager.getCommand(commandName, context.guild?.id);
    if (!command) return;
    if (!command.isDMAllowed() && isDM) return;
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
