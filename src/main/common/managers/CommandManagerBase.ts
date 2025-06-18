import { CommandStructureBase } from '../structures';

export abstract class CommandManagerBase {
  protected static instance: CommandManagerBase;

  protected commands: Map<string[], CommandStructureBase> = new Map();

  constructor() {
    if (CommandManagerBase.instance) {
      return CommandManagerBase.instance;
    }
    CommandManagerBase.instance = this;
  }

  /**
   * Gets all commands.
   * @returns {CommandStructureBase[]}
   */
  public getCommands(): CommandStructureBase[] {
    return this.commands.values().toArray();
  }

  public abstract registerCommand(command: CommandStructureBase | CommandStructureBase[]): unknown | Promise<unknown>;

  public abstract unregisterCommand(command: CommandStructureBase | CommandStructureBase[]): unknown | Promise<unknown>;


  public abstract getInstance(): CommandManagerBase;
}
