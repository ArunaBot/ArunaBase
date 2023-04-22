import { Interaction, Message, CommandInteraction, GuildMember, InteractionResponse, BooleanCache, EmbedBuilder, ChannelType, DiscordAPIError } from 'discord.js';
import { AsyncCommandStructure, CommandStructure } from '../structures';
import { IDiscordCommandContext } from '../../interfaces';
import { DiscordClient } from '../Client';

export class CommandListener {
  private additionalContext: { [key: symbol]: any };
  private client: DiscordClient;

  constructor(client: DiscordClient, enableLegacy: boolean, enableSlash: boolean, additionalContext?: { [key: symbol]: any }) {
    this.client = client;
    if (enableLegacy) this.client.on('messageCreate', this.onMessage.bind(this));
    if (enableSlash) this.client.on('interactionCreate', this.onInteractionCreate.bind(this));
    this.additionalContext = additionalContext ?? {};
  }

  private async onMessage(message: Message): Promise<void> {
    const prefix = this.client.getCommandManager().getPrefix();

    if (message.author.bot || !message.content || !prefix) return;
    if (!message.content.startsWith(prefix)) return;

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
        reply: async (...content: [string | EmbedBuilder]): Promise<Message<boolean>> => {
          return new Promise(async (resolve, reject) => {
            message.reply(this.replyParser(...content)).then((result) => {
              context.messageReplyContent = result;
              return resolve(result);
            }).catch((error: DiscordAPIError) => {
              if (error.code === 10008 || error.code === 50035) {
                message.channel.send(this.replyParser(...content)).then((result) => {
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
        editReply: async (...content: [string | EmbedBuilder]): Promise<Message> => {
          if (context.messageReplyContent && (context.messageReplyContent as Message<boolean>).editable) {
            return (context.messageReplyContent as Message<boolean>).edit(this.replyParser(...content));
          }
          return (context.reply(...content) as Promise<Message<boolean>>);
        },
        discreteReply: async (...content: [string | EmbedBuilder]): Promise<Message<boolean>> => {
          return new Promise((resolve, reject) => {
            context.reply(...content).then((result) => {
              return resolve(result as Message<boolean>);
            }).catch((reason) => {
              return reject(reason);
            });
          });
        },
        deleteReply: async (): Promise<void | Message<boolean>> => {
          if (!context.messageReplyContent || !(context.messageReplyContent as Message<boolean>)?.deletable) return Promise.resolve();
          return (context.messageReplyContent as Message<boolean>).delete();
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

  private async onInteractionCreate(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;

    const ctx = interaction as CommandInteraction;
    const commandName = ctx.commandName;

    try {
      const context: IDiscordCommandContext = {
        client: this.client,
        guild: ctx.guild,
        channel: ctx.channel,
        member: ctx.member as GuildMember,
        author: ctx.user,
        args: ctx.options.data.map((arg) => arg.value),
        reply: async (...content: [string | EmbedBuilder]): Promise<InteractionResponse<boolean>> => {
          return await ctx.reply(this.replyParser(...content));
        },
        editReply: async (...content: [string | EmbedBuilder]): Promise<Message<BooleanCache<any>>> => {
          return await ctx.editReply(this.replyParser(...content));
        },
        discreteReply: async (...content: [string | EmbedBuilder]): Promise<InteractionResponse<boolean>> => {
          return await ctx.reply({ ...this.replyParser(...content), ephemeral: true });
        },
        deleteReply: async (): Promise<void> => {
          return ctx.deleteReply();
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

  private replyParser(...params: [string | EmbedBuilder]): { content?: string, embeds?: EmbedBuilder[] } {
    const result: { content?: string, embeds?: EmbedBuilder[] } = {
      content: '',
      embeds: [],
    };

    params.forEach((item) => {
      if (typeof item === 'string') {
        result.content = item;
      } else {
        result.embeds!.push(item);
      }
    });

    return result;
  }

  private async executeCommand(commandName: string, context: IDiscordCommandContext, isDM = false): Promise<void> {
    context = { ...context, ...this.additionalContext };
    const command = this.client.getCommandManager().getCommand(commandName, context.guild?.id);
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
