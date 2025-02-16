import { EConditionalPrefixType, EHTTP, IAsyncCommandOptions, ICommandGuildScope, ICommandManagerOptions, ICommandOptions, IEndPointStructure, StructuredCommand } from '../../interfaces';
import { CommandStructureBased, CommandStructure, AsyncCommandStructure, ConditionalPrefixStructure } from '../structures';
import { ApplicationCommandType, Collection } from 'discord.js';
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
export class CommandManager {
  /**
   * A collection of commands that can only be used in specific Discord guilds.
   * @type {Collection<ICommandGuildScope, CommandStructureBased>}
   * @private
   */
  private guildCommands: Collection<ICommandGuildScope, CommandStructureBased> = new Collection();

  /**
   * A collection of commands that can be used in any Discord guild.
   * @type {Collection<string[], CommandStructureBased>}
   * @private
   */
  private globalCommands: Collection<string[], CommandStructureBased> = new Collection();

  /**
   * An array of custom prefixes that can be used to execute commands.
   * @type {ConditionalPrefixStructure[]}
   * @private
   */
  private customPrefixes: ConditionalPrefixStructure[] = [];

  /**
   * The options for this command manager.
   * @type {ICommandManagerOptions}
   * @private
   */
  private options: ICommandManagerOptions;

  // private endpointBufferInstance: Generator<unknown, CommandStructureBased, unknown>;
  private endpointsBuffer: IEndPointStructure[];
  private commandListener: CommandListener;
  private processingBuffer: boolean;
  private httpClient: HTTPClient;

  /**
   * Creates an instance of the CommandManager class.
   * @param {ICommandManagerOptions} options - The options for this command manager.
   */
  constructor(options: ICommandManagerOptions) {
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
    // get the first element from the array
    if (!this.options.client.isReady()) {
      this.options.client.getLogger().debug('CommandManager: Client is not ready. Pausing endpoint buffer.');
      this.options.client.once('ready', () => {
        this.options.client.getLogger().debug('CommandManager: Ready event received. Resuming endpoint buffer.');
        this.endpointBufferRunner();
      });
      return;
    }
    const packetObject = this.endpointsBuffer[0];
    if (!packetObject) return;
    if (this.processingBuffer) return;
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
    var retryAfter = parseFloat((headers['x-ratelimit-reset-after'] as string)) * 1000;
    if (remainingTillReset === 0) {
      this.options.client.getLogger().debug(
        `CommandManager: Discord will rate limit the bot. Registering ${!(packetObject.command instanceof Array) ? packetObject.command!.name : packetObject.command!.map((i) => i.name).join(', ')}. Retrying after ${retryAfter}ms.`,
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
        `CommandManager: Discord rate limited the bot. Registering ${!(packetObject.command instanceof Array) ? packetObject.command!.name : packetObject.command!.map((i) => i.name).join(', ')}. Retrying after ${retryAfter}ms.`,
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
   * Gets the collection of global commands.
   * @returns {Collection<string[], CommandStructureBased>}
   */
  public getGlobalCommands(): Collection<string[], CommandStructureBased> {
    return this.globalCommands;
  }

  /**
   * Gets a global command by its name.
   * @param {string} name - The name of the command.
   * @returns {(CommandStructureBased | null)}
   */
  public getGlobalCommand(name: string): CommandStructureBased | null {
    return this.globalCommands.find((value, key) => key.includes(name)) ?? null;
  }

  /**
   * Checks if a global command exists by its name.
   * @param {string | string[]} name - The name of the command.
   * @returns {boolean}
   */
  public hasGlobalCommand(name: string | string[]): boolean {
    if (name instanceof Array) {
      return this.globalCommands.has(name);
    } else {
      return !!this.globalCommands.find((value, key) => key.includes(name));
    }
  }

  /**
   * Registers a new command.
   * @param {CommandStructureBased} command - The command to register.
   * @returns {Collection<string | ICommandGuildScope, CommandStructureBased>}
   * @throws {Error} If a command with the same name already exists in the scope or if discord returns a status code different of 200 or 201.
   */
  public async registerCommand(command: CommandStructureBased | CommandStructureBased[]): Promise<CommandStructureBased | CommandStructureBased[]> {
    if (!command) throw new Error('CommandManager: Command is not defined.');
    if (command instanceof Array) return this.bulkRegisterCommand(command);
    if (!command.isGlobalCommand()) return this.registerGuildCommand(command);
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

    this.globalCommands.set(command.getAliases(), command);

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

    this.options.client.getLogger().warn('CommandManager: A command array was passed, this will override all commands (slash, user and message) for this bot. (This will delete all commands that isn\'t in array)');

    const globalCommands = commands.filter((command) => command.isGlobalCommand());
    const guildCommands = commands.filter((command) => !command.isGlobalCommand());

    const commandsResult: CommandStructureBased[] = [];

    if (guildCommands.length > 0) commandsResult.push(...(await this.bulkRegisterGuildCommand(guildCommands)));
    if (globalCommands.length <= 0) return commandsResult;

    const slashCommands = globalCommands.filter((command) => command.isSlash());

    const structuredCommands: StructuredCommand[] = [];
    const slashStructuredCommands: StructuredCommand[] = [];

    for (const command of globalCommands) {
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

      this.globalCommands.set(command.getAliases(), command);
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

    commandsResult.push(...globalCommands);
    return commandsResult;
  }

  /**
   * Registers a new guild-specific command.
   * @param command The command to register.
   * @returns The registered command.
   * 
   * @todo This method is not implemented yet.
   */
  public async registerGuildCommand(command: CommandStructureBased | CommandStructureBased[]): Promise<CommandStructureBased | CommandStructureBased[]> {
    if (!command) throw new Error('CommandManager: Command is not defined.');
    if (command instanceof Array) return this.bulkRegisterGuildCommand(command);
    if (command.isGlobalCommand()) throw new Error('CommandManager: This is a global command. Use registerCommand() instead.');
    // if (this.guildCommands.has({ guildID: command.getGuildID(), commandAliases: command.getAliases() })) throw new Error(`Command ${command.getName()} already exists in guild scope.`);
    // if (command.isSlash()) {
    //   // Slash Command
    //   const structuredCommand: StructuredCommand = {
    //     name: command.getName(),
    //     type: command.getType(),
    //     description: command.getDescription(),
    //     dm_permission: command.isDMAllowed(),
    //   };

    //   if (command.isLocalizedCommand()) {
    //     const localization = command.getLocalizations();
    //     if (localization.name_localizations) structuredCommand['name_localizations'] = localization.name_localizations;
    //     if (localization.name_localizations) structuredCommand['description_localizations'] = localization.description_localizations;
    //   }

    //   if (command.getParameters().length > 0) structuredCommand['options'] = command.getParameters();
    //   if (command.getGuildID())
    throw new Error('Not implemented 🦊');
  }

  /**
   * Registers multiple guild-specific commands.
   * @note This method will override all commands (slash, user and message) for this specific guild.
   * @param commands The commands to register.
   * @returns The registered commands.
   * 
   * @todo This method is not implemented yet.
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async bulkRegisterGuildCommand(commands: CommandStructureBased[]): Promise<CommandStructureBased[]> {
    throw new Error('Not implemented');
  }

  /**
   * Registers a custom prefix that can be used to execute commands.
   * @param prefix The custom prefix.
   * @param conditions The conditions that must be met for the prefix to be used.
   * @throws {Error} If some custom prefix with the one or more conditions already exists.
   */
  public registerCustomPrefix(prefix: string, condition: { type: EConditionalPrefixType, value: string }): boolean {
    if (!prefix) throw new Error('CommandManager: Prefix is not defined.');
    if (!condition) throw new Error('CommandManager: Condition is not defined.');

    if (this.customPrefixes.some((p) => p.getConditions().some((c) => c === condition))) throw new Error('CommandManager: Custom prefix with the same condition already exists.');

    const c = this.customPrefixes.find((customPrefix) => prefix === customPrefix.getPrefix());
    if (c) {
      c.addCondition(condition.type, condition.value);
      return true;
    }

    this.customPrefixes.push(new ConditionalPrefixStructure(prefix, [condition]));
    return true;
  }

  /**
   * Unregisters a custom prefix.
   * @param condition The condition that must be met for the prefix to be used.
   * @returns Whether the custom prefix was unregistered successfully.
   */
  public unregisterCustomPrefix(condition: { type: EConditionalPrefixType, value: string }): boolean {
    if (!condition) throw new Error('CommandManager: Condition is not defined.');
    
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
  public async unregisterCommand(command: CommandStructureBased): Promise<boolean> {
    if (!command) throw new Error('CommandManager: Command is not defined.');
    if (!command.isGlobalCommand()) return this.unregisterGuildCommand(command);
    if (command.isGlobalCommand() && !this.hasGlobalCommand(command.getAliases())) throw new Error(`Command ${command.getName()} does not exists in global scope.`);
    if (!command.isGlobalCommand() && !this.guildCommands.has({ guildID: command.getGuildID(), commandAliases: command.getAliases() })) throw new Error(`Command ${command.getName()} does not exists in guild scope.`);
    if (command.isSlash()) {
      this.makeEndpointRequest(
        EHTTP.DELETE,
        [`commands/${command.getSlashId()}`],
        (requestResult) => {
          if (!requestResult || !(requestResult instanceof Array)) throw new Error('CommandManager: Request result is not defined. You win!');
          const commandUnregisterSuccessfully = (requestResult[1] === 204);
          if (!commandUnregisterSuccessfully) throw new Error(`Command ${command.getName()} could not be unregistered.\nResponse: ${requestResult[0]}`);
        },
      );
    }

    if (command.isGlobalCommand()) {
      return this.globalCommands.delete(command.getAliases());
    } else {
      return this.guildCommands.delete({ guildID: command.getGuildID(), commandAliases: command.getAliases() });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async unregisterGuildCommand(command: CommandStructureBased): Promise<boolean> {
    throw new Error('Not implemented');
  }

  public getCustomPrefixes(): ConditionalPrefixStructure[] {
    return this.customPrefixes;
  }

  /**
   * Gets the collection of guild-specific commands.
   * @returns {Collection<ICommandGuildScope, CommandStructureBased>}
   */
  public getGuildCommands(): Collection<ICommandGuildScope, CommandStructureBased> {
    return this.guildCommands;
  }

  /**
   * Gets a guild-specific command.
   * @param {ICommandGuildScope} parameters - The parameters of the command to get.
   * @returns {(CommandStructureBased | null)}
   */
  public getGuildCommand(parameters: ICommandGuildScope): CommandStructureBased | null {
    return this.guildCommands.find((value, key) => {
      return (key.guildID === parameters.guildID) && (key.commandAliases.some((aliase) => { return parameters.commandAliases.includes(aliase); }));
    }) || null;
  }

  /**
   * Gets a command by its name, prioritizing guild-specific commands.
   * @param {string} name - The name of the command.
   * @param {string} [guildID] - The ID of the guild to get the command from.
   * @returns {(CommandStructureBased | null)}
   */
  public getCommand(name: string, guildID?: string): CommandStructureBased | null {
    var command;
    if (guildID) {
      command = this.getGuildCommand({ guildID, commandAliases: [name] });
    }

    if (!command) {
      command = this.getGlobalCommand(name);
    }

    return command;
  }

  /**
   * Generates a new `CommandStructure` instance.
   *
   * @param name - The name of the command.
   * @param options - The options for the command.
   * @returns The generated `CommandStructure` instance.
   */
  public generateCommand(name: string, options: ICommandOptions): CommandStructure {
    if (!options.isLegacyCommand) options.isLegacyCommand = true;
    if (!options.isSlashCommand) options.isSlashCommand = true;
    if (!options.type) options.type = ApplicationCommandType.ChatInput;
    if (!options.allowDM) options.allowDM = true;
    if (options.type === ApplicationCommandType.ChatInput) {
      if (!options.description) options.description = name;
      name = name.toLowerCase();
    } else if (options.description || options.description_localizations) {
      options.description = '';
      delete options.description_localizations;
    }
    const command = new CommandStructure(name, options);
    return command;
  }

  /**
   * Generates a new `AsyncCommandStructure` instance.
   *
   * @param name - The name of the command.
   * @param options - The options for the command.
   * @returns The generated `AsyncCommandStructure` instance.
   */
  public generateAsyncCommand(name: string, options: IAsyncCommandOptions): AsyncCommandStructure {
    if (!options.isLegacyCommand) options.isLegacyCommand = true;
    if (!options.isSlashCommand) options.isSlashCommand = true;
    if (!options.type) options.type = ApplicationCommandType.ChatInput;
    if (!options.allowDM) options.allowDM = true;
    const command = new AsyncCommandStructure(name, options);
    return command;
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
