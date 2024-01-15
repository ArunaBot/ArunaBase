import { ClientOptions, Client as DJSClient } from 'discord.js';
import { IDiscordConfiguration } from '../interfaces';
import { Logger } from '@promisepending/logger.js';
import { CommandManager } from './managers';

export class DiscordClient extends DJSClient {
  private allowSlashCommands: boolean;
  private allowLegacyCommands: boolean;
  private commandManager: CommandManager;
  private configuration: IDiscordConfiguration;
  private prefix: string;
  private logger: Logger;

  constructor(options: IDiscordConfiguration, logger?: Logger) {
    super(options as ClientOptions);

    this.prefix = options.prefix ?? '!';
    this.allowSlashCommands = options.allowSlashCommands ?? true;
    this.allowLegacyCommands = options.allowLegacyCommands ?? true;

    this.logger = logger ?? new Logger({
      prefix: this.prefix,
      coloredBackground: true,
      allLineColored: true,
    });

    this.configuration = options;
    this.commandManager = new CommandManager({
      client: this,
      logger: this.logger,
      prefix: this.prefix,
      allowLegacyCommands: this.allowLegacyCommands,
      allowSlashCommands: this.allowSlashCommands,
      additionalContext: options.additionalCommandContext,
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

  public getLogger(): Logger {
    return this.logger;
  }

  public login(token?: string): Promise<string> {
    if (token) {
      return super.login(token);
    } else if (this.configuration.token) {
      return super.login(this.configuration.token);
    } else {
      throw new Error('No token provided.');
    }
  }
}

export { IntentsBitField as Intents } from 'discord.js';
export * from 'discord.js';
