import {
  ApplicationCommandOptionType,
  BooleanCache,
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  Interaction,
  InteractionResponse,
  Message,
  MessageFlags,
} from 'discord.js';
import { CommandListener, MsgParams } from '../CommandListener';
import { ButtonManager, CommandManager } from '../../managers';
import { MessageStructure } from '../../structures';
import { ICommandContext } from '../../interfaces';
import { DiscordClient } from '../../Client';

export class SlashHandler {
  private static instance: SlashHandler;
  
  constructor(private manager: CommandManager, private client: DiscordClient, private listener: CommandListener) {
    if (SlashHandler.instance) {
      return SlashHandler.instance;
    }
    SlashHandler.instance = this;
  }
    
  public async run(ctx: Interaction): Promise<void> {
    if (!ctx.isCommand()) return;

    const context: ICommandContext = {
      client: this.client,
      guild: ctx.guild,
      channel: ctx.channel,
      member: ctx.member as GuildMember,
      author: ctx.user,
      args: (ctx as ChatInputCommandInteraction).options.data.map((arg) => {
        switch (arg.type) {
          case ApplicationCommandOptionType.User:
            return arg.user;
          case ApplicationCommandOptionType.Role:
            return arg.role;
          case ApplicationCommandOptionType.Channel:
            return arg.channel;
          case ApplicationCommandOptionType.Attachment:
            return arg.attachment;
          default:
            return arg.value;
        }
      }),
      reply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<BooleanCache<any>> | InteractionResponse<boolean>> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) return await ctx.reply(options[0]);
        return await ctx.reply(this.listener.replyParser(...(options as MsgParams[])));
      },
      editReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<BooleanCache<any>>> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) return await ctx.editReply(options[0]);
        return await ctx.editReply(this.listener.replyParser(...(options as MsgParams[])));
      },
      discreteReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<BooleanCache<any>>> => {
        if (options.length === 1 && options[0] instanceof MessageStructure) {
          return await ctx.reply({ ...options[0].toDiscordMessage(), flags: MessageFlags.Ephemeral }).then((result) => {
            ButtonManager.getInstance().registerButtons((options[0] as MessageStructure).getButtons());
            return result;
          });
        };
        return await ctx.reply({ ...this.listener.replyParser(...(options as MsgParams[])), flags: MessageFlags.Ephemeral });
      },
      deleteReply: async (): Promise<void> => {
        return ctx.deleteReply();
      },
      deferReply: async (ephemeral = false): Promise<InteractionResponse<boolean>> => {
        return ctx.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
      },
      showModal: async (modal) => {
        return ctx.showModal(modal);
      },
      isDM: ctx.channel?.type === ChannelType.DM,
      interaction: ctx,
    };

    this.listener.executeCommand(ctx.commandName, context).catch((error) => {
      const errorMessage = `An error occurred while execute command ${ctx.commandName}.`;
      if (!ctx.replied && !ctx.deferred) {
        ctx.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(() => {});
      } else if (ctx.deferred) {
        ctx.editReply({ content: errorMessage }).catch(() => {});
      }
      this.client.getLogger().error(`${errorMessage}\nError:`, error);
    });
  }
}
