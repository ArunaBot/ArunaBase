import { Interaction, Message, CommandInteraction, GuildMember, InteractionResponse } from 'discord.js';
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

  private onMessage(message: Message): void {
    if (message.author.bot) return;
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
      reply: message.reply.bind(message),
      discreteReply: message.reply.bind(message),
      args,
      message,
    };
    this.executeCommand(commandName, context);
  }

  private onInteractionCreate(interaction: Interaction): void {
    if (!interaction.isCommand()) return;
    const ctx = interaction as CommandInteraction;
    const name = ctx.commandName;
    const context: IDiscordCommandContext = {
      client: this.client,
      guild: ctx.guild,
      channel: ctx.channel,
      member: ctx.member as GuildMember,
      author: ctx.user,
      args: ctx.options.data.map((arg) => arg.value),
      reply: async (content: any): Promise<InteractionResponse<boolean>> => { return await ctx.reply({ content }); },
      discreteReply: async (content: any): Promise<InteractionResponse<boolean>> => { return await ctx.reply({ content, ephemeral: true }); },
      interaction: ctx,
    };
    try {
      this.executeCommand(name, context);
    } catch (error) {
      ctx.reply({ content: 'An error ocurred while execute command ' + name + '.', ephemeral: true });
      this.client.getLogger().error('An error ocurred while execute command ' + name + '.\nError:', error);
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
