import { IDiscordConfiguration } from '../interfaces';
import { Client as DJSClient } from 'discord.js';
import { CommandManager } from './managers';
import { Utils } from '@twitchapis/twitch.js';

export class DiscordClient extends DJSClient {
  private allowSlashCommands: boolean;
  private allowLegacyCommands: boolean;
  private commandManager: CommandManager;
  private configuration: IDiscordConfiguration;
  private prefix: string;
  private logger: Utils.Logger;

  constructor(options: IDiscordConfiguration) {
    super(options);

    this.prefix = options.prefix ?? '!';
    this.allowSlashCommands = options.allowSlashCommands ?? true;
    this.allowLegacyCommands = options.allowLegacyCommands ?? true;

    this.logger = new Utils.Logger({
      prefix: this.prefix,
      coloredBackground: true,
      allLineColored: true,
    });

    this.configuration = options;
    this.commandManager = new CommandManager({
      client: this,
      prefix: this.prefix,
      allowLegacyCommands: this.allowLegacyCommands,
      allowSlashCommands: this.allowSlashCommands,
    });
  }

  public getConfiguration(): IDiscordConfiguration {
    return this.configuration;
  }

  public getCommandManager(): CommandManager {
    return this.commandManager;
  }

  public getRawClient(): DJSClient {
    return (this as DJSClient);
  }

  public getLogger(): Utils.Logger {
    return this.logger;
  }
}

export { IntentsBitField as Intents } from 'discord.js';
export * as DJS from 'discord.js';
