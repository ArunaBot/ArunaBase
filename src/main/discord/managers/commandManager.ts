import { IAsyncCommandOptions, ICommandGuildScope, ICommandManagerOptions, ICommandOptions } from '../../interfaces';
import { CommandStructureBased, CommandStructure, AsyncCommandStructure } from '../structures';
import { HTTPClient } from '../utils/HTTPClient';
import { ApplicationCommandType, Collection } from 'discord.js';

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
 * commandManager.registerGlobalCommand(command);
 *
 * // The bot can now execute the ping command in any channel by using the configured prefix
 */
export class CommandManager {
  /**
   * A collection of commands that can be used in any Discord guild.
   * @type {Collection<string, CommandStructureBased>}
   * @private
   */
  private globalCommands: Collection<string, CommandStructureBased> = new Collection();

  /**
   * A collection of commands that can only be used in specific Discord guilds.
   * @type {Collection<ICommandGuildScope, CommandStructureBased>}
   * @private
   */
  private guildCommands: Collection<ICommandGuildScope, CommandStructureBased> = new Collection();

  /**
   * The options for this command manager.
   * @type {ICommandManagerOptions}
   * @private
   */
  private options: ICommandManagerOptions;
  private httpClient: HTTPClient;

  /**
   * Creates an instance of the CommandManager class.
   * @param {ICommandManagerOptions} options - The options for this command manager.
   */
  constructor(options: ICommandManagerOptions) {
    this.options = options;
    this.httpClient = new HTTPClient();
  }

  /**
   * Gets the collection of global commands.
   * @returns {Collection<string, CommandStructureBased>}
   */
  public getGlobalCommands(): Collection<string, CommandStructureBased> {
    return this.globalCommands;
  }

  /**
   * Gets a global command by its name.
   * @param {string} name - The name of the command.
   * @returns {(CommandStructureBased | null)}
   */
  public getGlobalCommand(name: string): CommandStructureBased | null {
    return this.globalCommands.get(name) || null;
  }

  /**
   * Registers a new global command.
   * @param {CommandStructureBased} command - The command to register.
   * @returns {Collection<string, CommandStructureBased>}
   * @throws {Error} If a command with the same name already exists in the global scope.
   */
  public async registerGlobalCommand(command: CommandStructureBased): Promise<Collection<string, CommandStructureBased>> {
    if (!command) throw new Error('Command is not defined');
    if (this.globalCommands.has(command.getName())) throw new Error(`Command ${command.getName()} already exists in global scope.`);
    if (!command.isGlobalCommand()) throw new Error(`Command ${command.getName()} is not a global command.`);
    var commandRegisterSuccessfully = true;
    if (command.isSlash()) {
      // Slash Command
      const structuredCommand = {
        name: command.getName(),
        type: command.getType(),
        description: command.getDescription(),
        dm_permission: command.isDMAllowed(),
        options: command.getParameters(),
      };
      if (command.isLocalizedCommand()) {
        const localization = command.getLocalizations();
        if (localization.name_localizations) Object.defineProperty(structuredCommand, 'name_localizations', localization.name_localizations);
        if (localization.name_localizations) Object.defineProperty(structuredCommand, 'description_localizations', localization.description_localizations);
      }
      if (command.getParameters().length === 0) delete structuredCommand.options;
      const requestResult = await this.httpClient.post(
        'v10',
        `applications/${this.options.client.application.id}/commands`,
        this.options.client.token,
        JSON.stringify(structuredCommand),
      );
      if (!(requestResult[1] === 201) && !(requestResult[1] === 200)) {
        commandRegisterSuccessfully = false;
      }
      if (!commandRegisterSuccessfully) throw new Error(`Command ${command.getName()} could not be registered.\nStatus code: ${requestResult[1]}\nResponse: ${requestResult[0]}`);
    }
    // if it succeeds we set the command internally, otherwise we throw an error and the command is not registered
    return this.globalCommands.set(command.getName(), command);
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
    return this.guildCommands.get(parameters) || null;
  }

  /**
   * Registers a new guild-specific command.
   * @param {CommandStructureBased} command - The command to register.
   * @param {string} guildID - The ID of the Discord guild where the command can be used.
   * @returns {Collection<ICommandGuildScope, CommandStructureBased>}
   * @throws {Error} If a command with the same name already exists in the specified guild scope.
   */
  public registerGuildCommand(command: CommandStructureBased, guildID: string): Collection<ICommandGuildScope, CommandStructureBased> {
    if (!command) throw new Error('Command is not defined');
    if (this.guildCommands.has({ guildID, commandName: command.getName() })) throw new Error(`Command ${command.getName()} already exists in guild scope.`);
    return this.guildCommands.set({ guildID, commandName: command.getName() }, command);
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
}
