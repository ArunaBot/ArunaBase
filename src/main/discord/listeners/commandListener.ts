import { Interaction, Message, CommandInteraction, GuildMember, InteractionResponse, BooleanCache } from 'discord.js';
import { IDiscordCommandContext } from '../../interfaces';
import { AsyncCommandStructure, CommandStructure } from '../structures';
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
    if (message.author.bot || !message.content) return;
    const prefix = this.client.getCommandManager().getPrefix();
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase() ?? '';
    const context: IDiscordCommandContext = {
      client: this.client,
      guild: message.guild,
      channel: message.channel,
      member: message.member,
      author: message.author,
      messageReplyContent: null,
      reply: async (content: any): Promise<Message<boolean>> => {
        return new Promise((resolve, reject) => {
          message.reply(content).then((result) => {
            context.messageReplyContent = result;
            return resolve(result);
          }).catch((reason) => {
            return reject(reason);
          });
        });
      },
      editReply: async (content: any): Promise<Message> => { return (context.messageReplyContent as Message<boolean>).edit(content); },
      discreteReply: message.reply.bind(message),
      args,
      message,
    };
    try {
      await this.executeCommand(commandName, context);
    } catch (error) {
      this.client.getLogger().error('An error ocurred while execute command ' + commandName + '.\nError:', error);
    }
  }

  private async onInteractionCreate(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;
    const ctx = interaction as CommandInteraction;
    const commandName = ctx.commandName;
    const context: IDiscordCommandContext = {
      client: this.client,
      guild: ctx.guild,
      channel: ctx.channel,
      member: ctx.member as GuildMember,
      author: ctx.user,
      args: ctx.options.data.map((arg) => arg.value),
      reply: async (content: any): Promise<InteractionResponse<boolean>> => { return await ctx.reply({ content }); },
      editReply: async (content: any): Promise<Message<BooleanCache<any>>> => { return await ctx.editReply({ content }); },
      discreteReply: async (content: any): Promise<InteractionResponse<boolean>> => { return await ctx.reply({ content, ephemeral: true }); },
      interaction: ctx,
    };
    try {
      await this.executeCommand(commandName, context);
    } catch (error) {
      const errorMessage = 'An error ocurred while execute command ' + commandName + '.';
      if (!ctx.replied) {
        ctx.reply({ content: errorMessage, ephemeral: true });
      }
      this.client.getLogger().error(errorMessage + '\nError:', error);
    }
  }

  private async executeCommand(commandName: string, context: IDiscordCommandContext): Promise<void> {
    context = { ...context, ...this.additionalContext };
    const command = this.client.getCommandManager().getCommand(commandName, context.guild?.id);
    if (!command) return;
    try {
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
