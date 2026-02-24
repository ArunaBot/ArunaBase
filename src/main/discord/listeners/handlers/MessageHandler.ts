import {
  ApplicationCommandOptionType,
  ChannelType,
  DiscordAPIError,
  GuildBasedChannel,
  Message,
  TextChannel,
} from 'discord.js';
import { CommandStructureBased, MessageStructure } from '../../structures';
import { CommandListener, MsgParams } from '../CommandListener';
import { ButtonManager, CommandManager } from '../../managers';
import { ICommandContext, MsgArgs } from '../../interfaces';
import { DiscordClient } from '../../Client';
import { RichEmbed } from '../../utils';

export class MessageHandler {
  private static instance: MessageHandler;

  constructor(private manager: CommandManager, private client: DiscordClient, private listener: CommandListener) {
    if (MessageHandler.instance) {
      return MessageHandler.instance;
    }
    MessageHandler.instance = this;
  }

  public async run(message: Message): Promise<void> {
    if (message.author.bot || !message.content) return;
    
    const customFound = this.manager.getCustomPrefixes().find((customPrefix) => customPrefix.testMessage(message));
    const prefix = customFound ? customFound.getPrefix() : this.manager.getPrefix();

    if (!prefix || !message.content.startsWith(prefix)) return;

    const isDM = (message.channel.type === ChannelType.DM);

    const [command, args] = this.parseArgs(message, prefix, isDM);
    
    if (!command) return;

    const context: ICommandContext = {
      client: this.client,
      guild: message.guild,
      channel: message.channel,
      member: message.member,
      author: message.author,
      messageReplyContent: null,
      reply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<boolean>> => {
        return new Promise(async (resolve, reject) => {
          const parsedContent = (options.length === 1 && options[0] instanceof MessageStructure) ? options[0].toDiscordMessage() : this.listener.replyParser(...options as MsgParams[]);
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

        if (context.messageReplyContent?.editable) return context.messageReplyContent.edit(this.listener.replyParser(...(options as MsgParams[])));
        return (context.reply(...(options as MsgParams[])) as Promise<Message<boolean>>);
      },
      discreteReply: async (...options: [MessageStructure] | MsgParams[]): Promise<Message<boolean>> => {
        return new Promise(async (resolve, reject) => {
          const parsedContent = (options.length === 1 && options[0] instanceof MessageStructure) ? options[0].toDiscordMessage() : this.listener.replyParser(...options as MsgParams[]);
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
      isDM,
      args,
      message,
    };
    this.listener.executeCommand(command, context, isDM).catch((error) => {
      this.client.getLogger().error(`An error occurred while execute command ${command.getName()}.\nError:`, error);
    });
  }

  private parseArgs(message: Message, prefix: string, isDM: boolean): [commandName: CommandStructureBased | null, commandArgs: MsgArgs[]] {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return [null, []];

    const command = this.manager.getCommand(commandName);
    if (!command) return [null, []];

    if (!command.isDMAllowed() && isDM) {
      message.reply({ embeds: [
        new RichEmbed()
          .setTitle('DM Not Allowed')
          .setDescription('This command cannot be used in Direct Messages.')
          .setColor('Red')
          .setTimestamp(),
      ],
      allowedMentions: { 
        repliedUser: false,
      },
      }).catch();

      return [null, []];
    }

    const errorEmbed = new RichEmbed()
      .setTitle('Invalid Argument')
      .setColor('Red')
      .setTimestamp();

    const requiredParams = command.getParameters().filter((param) => param.required);
    if (requiredParams.length > args.length) {
      // TODO: Allow custom error message
      message.reply(this.listener.replyParser(
        errorEmbed
          .setTitle('Missing Arguments')
          .setDescription(`Command Usage: \`${prefix}${commandName} ${requiredParams.map((param) => {
            if (!param.required) return `[${param.name}]`;
            return `<${param.name}>`;
          }).join(' ')}\``),
      )).catch();
      return [null, []];
    }

    const users = message.mentions.users.values().toArray();
    const roles = message.mentions.roles.values().toArray();
    const channels = message.mentions.channels.values().toArray();
    const attachments = message.attachments.values().toArray();

    const commandArgs: MsgArgs[] = [];
    for (const param of command.getParameters()) {
      if (param.required && args.length === 0) {
        // If a required parameter is missing, we stop parsing
        break;
      }

      const arg = args.shift();
      if (!arg) {
        continue;
      }

      if (param.choices && !param.choices.some(choice => choice.value === arg)) {
        message.reply(this.listener.replyParser(
          errorEmbed
            .setDescription(`The argument \`${param.name}\` must be one of the following: ${param.choices.map(choice => `\`${choice.value}\``).join(', ')}.`),
        )).catch();
        return [null, []];
      }

      let parsedArg: MsgArgs;
      
      switch (param.type) {
        case ApplicationCommandOptionType.String:
          if (arg.length < (param.min_length ?? 0) || arg.length > (param.max_length ?? 2000)) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be between ${param.min_length ?? 0} and ${param.max_length ?? 2000} characters long.`),
            )).catch();
            return [null, []];
          }
          parsedArg = arg;
          break;
        case ApplicationCommandOptionType.Integer: {
          const intVal = parseInt(arg, 10);
          if (isNaN(intVal) || !Number.isInteger(intVal)) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid integer.`),
            )).catch();
            return [null, []];
          }
          if (intVal < (param.min_value ?? Number.MIN_SAFE_INTEGER) || intVal > (param.max_value ?? Number.MAX_SAFE_INTEGER)) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be between ${param.min_value ?? Number.MIN_SAFE_INTEGER} and ${param.max_value ?? Number.MAX_SAFE_INTEGER}.`),
            )).catch();
            return [null, []];
          }
          parsedArg = intVal;
          break;
        }
        case ApplicationCommandOptionType.Number: {
          const floatVal = parseFloat(arg);
          if (isNaN(floatVal)) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid number.`),
            )).catch();
            return [null, []];
          }
          if (floatVal < (param.min_value ?? Number.MIN_SAFE_INTEGER) || floatVal > (param.max_value ?? Number.MAX_SAFE_INTEGER)) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be between ${param.min_value ?? Number.MIN_SAFE_INTEGER} and ${param.max_value ?? Number.MAX_SAFE_INTEGER}.`),
            )).catch();
            return [null, []];
          }
          parsedArg = floatVal;
          break;
        }
        case ApplicationCommandOptionType.Boolean:
          if (arg.toLowerCase() === 'true' || arg === '1') {
            parsedArg = true;
          } else if (arg.toLowerCase() === 'false' || arg === '0') {
            parsedArg = false;
          } else {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid boolean (true/false).`),
            )).catch();
            return [null, []];
          }
          break;
        case ApplicationCommandOptionType.User: {
          const user = users.shift() || this.client.users.cache.get(arg);
          if (!user) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid user mention or ID.`),
            )).catch();
            return [null, []];
          }
          parsedArg = user;
          break;
        }
        case ApplicationCommandOptionType.Channel: {
          const channel = (channels.shift() || this.client.channels.cache.get(arg)) as GuildBasedChannel | undefined;
          if (!channel) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid channel mention or ID.`),
            )).catch();
            return [null, []];
          }
          parsedArg = channel;
          break;
        }
        case ApplicationCommandOptionType.Role: {
          const role = roles.shift() || this.client.guilds.cache.get(message.guildId!)?.roles.cache.get(arg);
          if (!role) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid role mention or ID.`),
            )).catch();
            return [null, []];
          }
          parsedArg = role;
          break;
        }
        case ApplicationCommandOptionType.Attachment: {
          const attachment = attachments.shift();
          if (!attachment) {
            message.reply(this.listener.replyParser(
              errorEmbed
                .setDescription(`The argument \`${param.name}\` must be a valid attachment.`),
            )).catch();
            return [null, []];
          }
          parsedArg = attachment;
          break;
        }
        case ApplicationCommandOptionType.Mentionable:
          parsedArg = arg;
          break;
        case ApplicationCommandOptionType.Subcommand:
        case ApplicationCommandOptionType.SubcommandGroup:
        default:
          break;
      }

      if (!parsedArg) continue;

      commandArgs.push(parsedArg);
    }

    if (args.length > 0) {
      commandArgs.push(args.join(' '));
    }
    return [command, commandArgs];
  }
}
