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

  // FIXME: This code is simply horrible and needs URGENT refactoring.
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
        reply: async (...options: [MessageStructure] | (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean>> => {
          return new Promise(async (resolve, reject) => {
            if (options.length === 1 && options[0] instanceof MessageStructure) {
              message._reply(options[0].toDiscordMessage()).then((result) => {
                context.messageReplyContent = result;
                ButtonManager.getInstance().registerButtons((options[0] as MessageStructure).getButtons());
                return resolve(result);
              }).catch((error: DiscordAPIError) => {
                if (error.code === 10008 || error.code === 50035) {
                  (message.channel as TextChannel).send(options[0] as MessageStructure).then((result) => {
                    context.messageReplyContent = result;
                    return resolve(result);
                  }).catch((reason) => {
                    return reject(reason);
                  });
                } else {
                  return reject(error);
                }
              });
            } else {
              const parsedOptions = this.replyParser(...(options as (string | EmbedBuilder | AttachmentBuilder)[]));
              message.reply(parsedOptions).then((result) => {
                context.messageReplyContent = result;
                return resolve(result);
              }).catch((error: DiscordAPIError) => {
                if (error.code === 10008 || error.code === 50035) {
                  (message.channel as TextChannel).send(parsedOptions).then((result) => {
                    context.messageReplyContent = result;
                    return resolve(result);
                  }).catch((reason) => {
                    return reject(reason);
                  });
                } else {
                  return reject(error);
                }
              });
            }
          });
        },
        editReply: async (...options: [MessageStructure] | (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message> => {
          if (options.length === 1 && options[0] instanceof MessageStructure) {
            if (context.messageReplyContent && (context.messageReplyContent as Message<boolean>).editable) {
              return (context.messageReplyContent as Message<boolean>).edit(options[0]);
            }
            return (context.reply(options[0]) as Promise<Message<boolean>>);
          } else {
            const parsedOptions = this.replyParser(...(options as (string | EmbedBuilder | AttachmentBuilder)[]));
            if (context.messageReplyContent && (context.messageReplyContent as Message<boolean>).editable) {
              return (context.messageReplyContent as Message<boolean>).edit(parsedOptions);
            }
            return (context.reply(...(options as (string | EmbedBuilder | AttachmentBuilder)[])) as Promise<Message<boolean>>);
          }
        },
        discreteReply: async (...options: [MessageStructure] | (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<boolean>> => {
          return new Promise(async (resolve, reject) => {
            if (options.length === 1 && options[0] instanceof MessageStructure) {
              const parsedContent = options[0].toDiscordMessage();
              message._reply({
                ...parsedContent,
                allowedMentions: {
                  repliedUser: false,
                },
              }).then((result) => {
                context.messageReplyContent = result;
                ButtonManager.getInstance().registerButtons((options[0] as MessageStructure).getButtons());
                return resolve(result);
              }).catch((error: DiscordAPIError) => {
                // 10008: Unknown Message
                // 50035: Cannot send messages to this user
                if (error.code === 10008 || error.code === 50035) {
                  (message.channel as TextChannel).send(options[0] as MessageStructure).then((result) => {
                    context.messageReplyContent = result;
                    return resolve(result);
                  }).catch((reason) => {
                    return reject(reason);
                  });
                } else {
                  return reject(error);
                }
              });
            } else {
              const parsedContent = this.replyParser(...options as (string | EmbedBuilder | AttachmentBuilder)[]);
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
                  (message.channel as TextChannel).send(this.replyParser(...options as (string | EmbedBuilder | AttachmentBuilder)[])).then((result) => {
                    context.messageReplyContent = result;
                    return resolve(result);
                  }).catch((reason) => {
                    return reject(reason);
                  });
                } else {
                  return reject(error);
                }
              });
            }
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
        reply: async (...options: [MessageStructure] | (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<BooleanCache<any>> | InteractionResponse<boolean>> => {
          if (options.length === 1 && options[0] instanceof MessageStructure) {
            // Caso seja um único argumento do tipo MessageStructure
            return await ctx.reply(options[0]);
          } else {
            // Caso sejam múltiplos argumentos, utiliza a função replyParser
            const parsedOptions = this.replyParser(...(options as (string | EmbedBuilder | AttachmentBuilder)[]));
            return await ctx.reply(parsedOptions);
          }
        },
        editReply: async (...options: [MessageStructure] | (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<BooleanCache<any>>> => {
          if (options.length === 1 && options[0] instanceof MessageStructure) {
            // Caso seja um único argumento do tipo MessageStructure
            return await ctx.editReply(options[0]);
          } else {
            // Caso sejam múltiplos argumentos, utiliza a função replyParser
            const parsedOptions = this.replyParser(...(options as (string | EmbedBuilder | AttachmentBuilder)[]));
            return await ctx.editReply(parsedOptions);
          }
        },
        discreteReply: async (...options: [MessageStructure] | (string | EmbedBuilder | AttachmentBuilder)[]): Promise<Message<BooleanCache<any>>> => {
          if (options.length === 1 && options[0] instanceof MessageStructure) {
            return await ctx.reply({ ...options[0].toDiscordMessage(), ephemeral: true }).then((result) => {
              ButtonManager.getInstance().registerButtons((options[0] as MessageStructure).getButtons());
              return result;
            });
          } else {
            const parsedOptions = this.replyParser(...(options as (string | EmbedBuilder | AttachmentBuilder)[]));
            return await ctx.reply({ ...parsedOptions, ephemeral: true });
          }
        },
        deleteReply: async (): Promise<void> => {
          return ctx.deleteReply();
        },
        deferReply: async (ephemeral = false): Promise<InteractionResponse<boolean>> => {
          if (ephemeral) return ctx.deferReply({ flags: MessageFlags.Ephemeral });
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
