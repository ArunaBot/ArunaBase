import {
  EConditionalPrefixType, 
  ICommandManagerOptions,
  IAsyncCommandOptions,
  IEndPointStructure,
  StructuredCommand,
  ICommandOptions,
} from '../interfaces';
import { CommandStructureBased, CommandStructure, AsyncCommandStructure, ConditionalPrefixStructure } from '../structures';
import { CommandManagerBase, EHTTP } from '../../common/';
import { ApplicationCommandType } from 'discord.js';
import { CommandListener } from '../listeners';
import { HTTPClient } from '../utils/';

/**
 * CommandManager is a class responsible for managing and organizing the commands in a Discord bot.
 * It allows the user to create global and guild-specific commands, and provides methods for accessing and modifying the commands.
 *
 * @example
 * const commandManager = new CommandManager({
 *   client: client,
 *   prefix: '!', // Default '!'
 *   allowLegacyCommands: true, // Default TRUE
 *   allowSlashCommands: true // Default TRUE
 * });
 *
 * const command = commandManager.generateCommand('ping', {
 *   execute: (message) => {
 *     message.channel.send('Pong!');
 *   }
 * });
 *
 * commandManager.registerCommand(command);
 *
 * // The bot can now execute the ping command in any channel by using the configured prefix or by using the slash command.
 */
export class CommandManager extends CommandManagerBase {
  protected override commands: Map<string[], CommandStructureBased> = new Map();
  protected static override instance: CommandManager;

  private customPrefixes: ConditionalPrefixStructure[] = [];
  private readonly commandListener: CommandListener;
  private endpointsBuffer: IEndPointStructure[];
  private options: ICommandManagerOptions;
  private processingBuffer: boolean;
  private httpClient: HTTPClient;

  /**
   * Creates an instance of the CommandManager class.
   * @param {ICommandManagerOptions} options - The options for this command manager.
   */
  constructor(options: ICommandManagerOptions) {
    super();
    this.options = options;
    this.options.allowLegacyCommands = this.options.allowLegacyCommands ?? true;
    this.options.allowSlashCommands = this.options.allowSlashCommands ?? true;
    if (!this.options.prefix) this.options.allowLegacyCommands = false;
    this.httpClient = new HTTPClient();
    this.commandListener = new CommandListener(this, this.options.client, this.options.allowLegacyCommands, this.options.allowSlashCommands, this.options.additionalContext ?? {});

    this.endpointsBuffer = [];
    this.processingBuffer = false;
  }

  private async endpointBufferRunner(): Promise<void> {
    if (!this.options.client.isReady()) {
      this.options.client.getLogger().debug('CommandManager: Client is not ready. Pausing endpoint buffer.');
      this.options.client.once('ready', () => {
        this.options.client.getLogger().debug('CommandManager: Ready event received. Resuming endpoint buffer.');
        this.endpointBufferRunner();
      });
      return;
    }
    const packetObject = this.endpointsBuffer[0];
    if (!packetObject || this.processingBuffer) return;
    this.processingBuffer = true;
    const result = await this.httpClient.makeRequest(
      packetObject.type,
      'v10',
      `applications/${this.options.client.application.id}${packetObject.route.startsWith('/') ? '' : '/'}${packetObject.route}`,
      this.options.client.token,
      packetObject.command ? JSON.stringify(packetObject.command) : null,
    );
    const data = JSON.parse((result[0] as string));
    const headers = result[2];
    const statusCode = result[1];
    const remainingTillReset = parseInt((headers['x-ratelimit-remaining'] as string));
    let retryAfter = parseFloat((headers['x-ratelimit-reset-after'] as string)) * 1000;
    if (remainingTillReset === 0) {
      this.options.client.getLogger().debug(
        `CommandManager: Discord will rate limit the bot. Registering ${
          !(packetObject.command instanceof Array) ?
            packetObject.command!.name : packetObject.command!.map((i) => i.name).join(', ')
        }. Retrying after ${retryAfter}ms.`,
      );
      setTimeout(() => {
        this.processingBuffer = false;
        this.options.client.getLogger().debug('CommandManager: Discord rate limit reset. Resuming endpoint buffer.');
        this.endpointBufferRunner();
      }, retryAfter);
      return;
    }
    if (statusCode === 429) {
      retryAfter = (data.retry_after * 1000);
      this.options.client.getLogger().debug(
        `CommandManager: Discord rate limited the bot. Registering ${
          !(packetObject.command instanceof Array) ?
              packetObject.command!.name : packetObject.command!.map((i) => i.name).join(', ')
        }. Retrying after ${retryAfter}ms.`,
      );
      if (isNaN(retryAfter)) throw new Error('CommandManager: Discord rate limited the bot and didn\'t provide a retry-after value. You win!\n' + data);
      setTimeout(() => {
        this.processingBuffer = false;
        this.options.client.getLogger().debug('CommandManager: Discord rate limit reset. Resuming endpoint buffer.');
        this.endpointBufferRunner();
      }, retryAfter);
      return;
    }
    if (packetObject.callback) packetObject.callback([data, statusCode, headers]);
    this.processingBuffer = false;
    this.endpointsBuffer.shift();
    this.endpointBufferRunner();
  }

  private makeEndpointRequest(type: EHTTP, [route, command]: [string, (StructuredCommand | StructuredCommand[])?], callback?: (requestResult: unknown) => void, priority = false): void {
    const packetObject = {
      type,
      route,
      command,
      callback,
    };
    if (priority) this.endpointsBuffer.unshift(packetObject);
    else this.endpointsBuffer.push(packetObject);
    this.endpointBufferRunner();
  }

  /**
   * Registers a new command.
   * @param {CommandStructureBased} command - The command to register.
   * @returns {Promise<CommandStructureBased | CommandStructureBased[]>}
   * @throws {Error} If a command with the same name already exists in the scope or if discord returns a status code different of 200 or 201.
   */
  public override async registerCommand(command: CommandStructureBased | CommandStructureBased[]): Promise<CommandStructureBased | CommandStructureBased[]> {
    if (!command) throw new Error('CommandManager: Command is not defined.');
    if (command instanceof Array) return this.bulkRegisterCommand(command);
    if (command.isSlash()) {
      // Slash Command
      const structuredCommand: StructuredCommand = {
        name: command.getName(),
        type: command.getType(),
        description: command.getDescription(),
        dm_permission: command.isDMAllowed(),
      };

      if (command.isLocalizedCommand()) {
        const localization = command.getLocalizations();
        if (localization.name_localizations) structuredCommand['name_localizations'] = localization.name_localizations;
        if (localization.name_localizations) structuredCommand['description_localizations'] = localization.description_localizations;
      }

      if (command.getParameters().length > 0) structuredCommand['options'] = command.getParameters();

      this.makeEndpointRequest(
        EHTTP.POST,
        [
          'commands',
          structuredCommand,
        ],
        (requestResult) => {
          if (!requestResult || !(requestResult instanceof Array)) throw new Error('CommandManager: Request result is not defined. You win!');
          if (requestResult.length < 2) throw new Error('CommandManager: Request result is not valid. Are you okay?');
          const commandRegisterSuccessfully = ((requestResult[1] === 201) || (requestResult[1] === 200));

          if (!commandRegisterSuccessfully) throw new Error(`Command ${command.getName()} could not be registered.\nStatus code: ${requestResult[1]}\nResponse: ${requestResult[0]}`);

          command.setSlashId(requestResult[0].id);
        },
      );
    }

    this.commands.set(command.getAliases(), command);

    return command;
  }

  /**
   * Registers multiple commands.
   * @note This method will override all commands (slash, user and message) for this bot.
   * @param commands The commands to register.
   * @returns The registered commands.
   */
  public async bulkRegisterCommand(commands: CommandStructureBased[]): Promise<CommandStructureBased[]> {
    if (!commands) throw new Error('CommandManager: Command is not defined.');
    if (commands.length === 0) throw new Error('CommandManager: Command array is empty.');
    if (commands.length === 1) return [(await this.registerCommand(commands[0]) as CommandStructureBased)];

    this.options.client.getLogger().warn(
      `CommandManager: A command array was passed, this will override all commands(slash, user and message) for this bot. (This will delete all commands that isn't in array)`,
    );

    const slashCommands = commands.filter((command) => command.isSlash());

    const structuredCommands: StructuredCommand[] = [];
    const slashStructuredCommands: StructuredCommand[] = [];

    for (const command of commands) {
      const structuredCommand: StructuredCommand = {
        name: command.getName(),
        type: command.getType(),
        description: command.getDescription(),
        dm_permission: command.isDMAllowed(),
      };

      if (command.isLocalizedCommand()) {
        const localization = command.getLocalizations();
        if (localization.name_localizations) structuredCommand['name_localizations'] = localization.name_localizations;
        if (localization.name_localizations) structuredCommand['description_localizations'] = localization.description_localizations;
      }

      if (command.getParameters().length > 0) structuredCommand['options'] = command.getParameters();
      if (command.isSlash()) slashStructuredCommands.push(structuredCommand);

      this.commands.set(command.getAliases(), command);
      structuredCommands.push(structuredCommand);
    }

    this.makeEndpointRequest(
      EHTTP.PUT,
      [
        'commands',
        slashStructuredCommands,
      ],
      (requestResult) => {
        if (!requestResult || !(requestResult instanceof Array)) throw new Error('CommandManager: Request result is not defined. You win!');
        if (requestResult.length < 2) throw new Error('CommandManager: Request result is not valid. Are you okay?');
        const commandRegisterSuccessfully = ((requestResult[1] === 201) || (requestResult[1] === 200));

        if (!commandRegisterSuccessfully) throw new Error(`Commands ${commands.map((i) => i.getName()).join(', ')} could not be registered.\nResponse: ${JSON.stringify(requestResult[0])}`);

        for (const command of slashCommands) {
          command.setSlashId(requestResult[0].id);
        }
      },
    );

    return commands;
  }

  /**
   * Registers a custom prefix that can be used to execute commands.
   * @param prefix The custom prefix.
   * @param conditions The conditions that must be met for the prefix to be used.
   * @throws {Error} If some custom prefix with one or more conditions already exists.
   */
  public registerCustomPrefix(prefix: string, condition: { type: EConditionalPrefixType, value: string }): boolean {
    if (!prefix) throw new Error('CommandManager: Prefix is not defined.');
    if (!condition) throw new Error('CommandManager: Condition is not defined.');

    if (this.customPrefixes.some((p) => p.getConditions().some((c) => c === condition))) throw new Error('CommandManager: Custom prefix with the same condition already exists.');

    const customPrefix = this.customPrefixes.find((customPrefix) => prefix === customPrefix.getPrefix());
    if (customPrefix) customPrefix.addCondition(condition.type, condition.value);
    else this.customPrefixes.push(new ConditionalPrefixStructure(prefix, [condition]));

    return true;
  }

  /**
   * Unregisters a custom prefix.
   * @param condition The condition that must be met for the prefix to be used.
   * @returns Whether the custom prefix was unregistered successfully.
   */
  public unregisterCustomPrefix(condition: { type: EConditionalPrefixType, value: string }): boolean {
    if (!condition) throw new Error('CommandManager: Condition isn\'t defined.');
    
    const customPrefix = this.customPrefixes.find((p) => p.getConditions().some((c) => c.type === condition.type && c.value === condition.value));
    if (!customPrefix) return false;

    customPrefix.removeCondition(condition.type, condition.value);
    if (customPrefix.getConditions().length === 0) this.customPrefixes = this.customPrefixes.filter((p) => p !== customPrefix);
    return true;
  }

  /**
   * Unregisters a command.
   * @param command The command to unregister.
   * @returns Whether the command was unregistered successfully.
   */
  public override async unregisterCommand(command: CommandStructureBased): Promise<boolean> {
    if (!command) throw new Error('CommandManager: Command is not defined.');
    if (!this.hasCommand(command.getAliases())) throw new Error(`Command ${command.getName()} doesn't exists.`);
    if (command.isSlash()) {
      this.makeEndpointRequest(
        EHTTP.DELETE,
        [`commands/${command.getSlashId()}`],
        (requestResult) => {
          if (!requestResult || !(requestResult instanceof Array)) throw new Error('CommandManager: Request result is not defined. You win!');
          // 204 status code: command unregistered successfully
          if (requestResult[1] !== 204) throw new Error(`Command ${command.getName()} couldn't be unregistered.\nResponse: ${requestResult[0]}`);
        },
      );
    }

    return this.commands.delete(command.getAliases());
  }

  public getCustomPrefixes(): ConditionalPrefixStructure[] {
    return this.customPrefixes;
  }

  /**
   * Gets all commands.
   * @returns {CommandStructureBased[]}
   */
  public override getCommands(): CommandStructureBased[] {
    return this.commands.values().toArray();
  }

  /**
   * Gets a command by its name
   * @param {string} name - The name of the command.
   * @returns {(CommandStructureBased | null)}
   */
  public getCommand(name: string): CommandStructureBased | null {
    return this.commands.entries().find((value) => value[0].includes(name.toLowerCase()))?.[1] || null;
  }

  /**
   * Checks if a command exists by its name
   * @param {string | string[]} name - The name of the command.
   * @returns {boolean}
   */
  public hasCommand(name: string | string[]): boolean {
    if (name instanceof Array) return this.commands.has(name);
    return !!this.commands.keys().find((aliases) => aliases.includes(name.toLowerCase()));
  }

  /**
   * Generates a new `CommandStructure` instance.
   *
   * @param name - The name of the command.
   * @param options - The options for the command.
   * @returns The generated `CommandStructure` instance.
   */
  public generateCommand(name: string, options: ICommandOptions | IAsyncCommandOptions, asyncCommand: boolean = false): CommandStructure | AsyncCommandStructure {
    if (options.isLegacyCommand == null) options.isLegacyCommand = true;
    if (options.isSlashCommand == null) options.isSlashCommand = true;
    if (options.allowDM == null) options.allowDM = true;
    if (!options.type) options.type = ApplicationCommandType.ChatInput;
    if (options.type === ApplicationCommandType.ChatInput) {
      if (!options.description) options.description = name;
      name = name.toLowerCase();
    } else if (options.description || options.description_localizations) {
      options.description = '';
      delete options.description_localizations;
    }
    return new (asyncCommand ? AsyncCommandStructure : CommandStructure)(name, options);
  }

  /**
   * Generates a new `AsyncCommandStructure` instance.
   *
   * @param name - The name of the command.
   * @param options - The options for the command.
   * @returns The generated `AsyncCommandStructure` instance.
   * @deprecated Use `generateCommand` with `asyncCommand` set to `true` instead.
   * @see {@link CommandManager#generateCommand}
   */
  public generateAsyncCommand(name: string, options: IAsyncCommandOptions): AsyncCommandStructure {
    return this.generateCommand(name, options, true) as AsyncCommandStructure;
  }

  public override getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager(this.options);
    }
    return CommandManager.instance;
  }

  public getPrefix(): string | null {
    return this.options.prefix ?? null;
  }

  public isLegacyCommandEnabled(): boolean {
    return this.options.allowLegacyCommands ?? false;
  }

  public isSlashCommandEnabled(): boolean {
    return this.options.allowSlashCommands ?? false;
  }
}
