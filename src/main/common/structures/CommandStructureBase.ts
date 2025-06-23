import { ICommandOptionsBase } from '../interfaces';

export abstract class CommandStructureBase {
  private name: string;
  private description: string;

  protected aliases: string[];
  protected isAsync = false;

  constructor(name: string, options: ICommandOptionsBase) {
    this.name = this.checkAndFixName(name);
    this.description = options.description ?? '';
    this.aliases = options.aliases ?? [];

    this.aliases = this.aliases.map(alias => this.checkAndFixName(alias));

    if (!this.aliases.includes(this.name)) {
      this.aliases.unshift(this.name);
    }
  }

  protected checkAndFixName(name: string): string {
    if (name.length > 32) throw new Error(`Command name or aliase: ${name} is too long (max 32, current: ${name.length})`);
    if (name.length < 1) throw new Error(`Command name or aliase: ${name} is too short (min 1, current: ${name.length})`);
    if (name !== name.toLowerCase()) {
      console.warn(`WARNING: Command name or aliase: ${name} is not lowercase, converting to lowercase`);
    }
    if (name.includes(' ')) {
      console.warn(`WARNING: Command name or aliase: ${name} has spaces, replacing spaces with _`);
    }
    return name.toLowerCase().replace(/ /g, '_');
  }
  
  public getName(): string {
    return this.name;
  }
  
  public getDescription(): string {
    return this.description;
  }
  
  public getAliases(): string[] {
    return this.aliases;
  }

  public abstract checkPermission(...args: unknown[]): boolean

  public abstract run(...args: unknown[]): unknown | Promise<unknown>

  protected abstract execute(...args: unknown[]): unknown | Promise<unknown>
}
