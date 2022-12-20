import { IAsyncCommandOptions, ICommandGuildScope, ICommandManagerOptions, ICommandOptions } from '../../interfaces';
import { CommandStructureBased, CommandStructure, AsyncCommandStructure } from '../structures';
import { ApplicationCommandType, Collection } from 'discord.js';
import { CommandListener } from '../listeners';
import { HTTPClient } from '../utils/HTTPClient';

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
  private commandListener: CommandListener;
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
    this.commandListener = new CommandListener(this.options.client, this.options.allowLegacyCommands, this.options.allowSlashCommands, this.options.additionalContext ?? {});
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
   * Registers a new command.
   * @param {CommandStructureBased} command - The command to register.
   * @returns {Collection<string | ICommandGuildScope, CommandStructureBased>}
   * @throws {Error} If a command with the same name already exists in the scope or if discord returns a status code different of 200 or 201.
   */
  public async registerCommand(command: CommandStructureBased): Promise<Collection<string | ICommandGuildScope, CommandStructureBased>> {
    if (!command) throw new Error('Command is not defined');
    if (command.isSlash()) {
      // Slash Command
      if (command.isGlobalCommand() && this.globalCommands.has(command.getName())) throw new Error(`Command ${command.getName()} already exists in global scope.`);
      // eslint-disable-next-line max-len
      if (!command.isGlobalCommand() && this.guildCommands.has({ guildID: command.getGuildID(), commandName: command.getName() })) throw new Error(`Command ${command.getName()} already exists in guild scope.`);

      const structuredCommand = {
        name: command.getName(),
        type: command.getType(),
        description: command.getDescription(),
        dm_permission: command.isDMAllowed(),
        guild_id: command.getGuildID(),
        options: command.getParameters(),
      };

      if (command.isLocalizedCommand()) {
        const localization = command.getLocalizations();
        if (localization.name_localizations) Object.defineProperty(structuredCommand, 'name_localizations', localization.name_localizations);
        if (localization.name_localizations) Object.defineProperty(structuredCommand, 'description_localizations', localization.description_localizations);
      }

      if (command.getParameters().length === 0) delete structuredCommand.options;
      if (command.isGlobalCommand()) delete structuredCommand.guild_id;

      const requestResult = await this.httpClient.post(
        'v10',
        // eslint-disable-next-line max-len
        command.isGlobalCommand() ? `applications/${this.options.client.application.id}/commands` : `applications/${this.options.client.application.id}/guilds/${command.getGuildID()}/commands`,
        this.options.client.token,
        JSON.stringify(structuredCommand),
      );
      const commandRegisterSuccessfully = ((requestResult[1] === 201) || (requestResult[1] === 200));

      // eslint-disable-next-line max-len
      if (!commandRegisterSuccessfully) throw new Error(`${!command.isGlobalCommand() ? 'Guild ' : ''}Command ${command.getName()} could not be registered.\nStatus code: ${requestResult[1]}\nResponse: ${requestResult[0]}`);
      // eslint-disable-next-line max-len
      if (command.isGlobalCommand()) return this.globalCommands.set(command.getName(), command); else return this.guildCommands.set({ guildID: command.getGuildID(), commandName: command.getName() }, command);
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
   * Gets a command by its name, prioritizing guild-specific commands.
   * @param {string} name - The name of the command.
   * @param {string} [guildID] - The ID of the guild to get the command from.
   * @returns {(CommandStructureBased | null)}
   */
  public getCommand(name: string, guildID?: string): CommandStructureBased | null {
    var command;
    if (guildID) {
      command = this.getGuildCommand({ guildID, commandName: name });
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
