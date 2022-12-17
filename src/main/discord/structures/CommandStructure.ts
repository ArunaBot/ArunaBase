/* eslint-disable quote-props */
import { IAsyncCommandOptions, ICommandOptions, ILocalizationBase } from '../../interfaces';

class CommandStructureBase {
  private name: string;
  private description: string;
  private localizations: { [key: string]: ILocalizationBase };
  private guildID: string;

  protected isAsync: boolean;
  protected isSlashCommand: boolean;
  protected isLegacyCommand: boolean;
  protected isLocalized: boolean;
  protected isGlobal: boolean;
  protected allowDM: boolean;
  protected aliases: string[];

  constructor(name: string, options: ICommandOptions) {
    this.name = name;
    this.description = options.description;
    this.isSlashCommand = options.isSlashCommand;
    this.isLegacyCommand = options.isLegacyCommand;
    this.allowDM = options.allowDM ?? true;
    this.aliases = options.aliases ?? [];

    if (options.name_localizations || options.description_localizations) {
      this.isLocalized = true;
      this.localizations = {
        'name_localizations': options.name_localizations,
        'description_localizations': options.description_localizations,
      };
    }

    if (options.guildID) {
      this.isGlobal = false;
      this.guildID = options.guildID;
    }
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

  public getLocalizations(): { [key: string]: ILocalizationBase } {
    if (!this.isLocalized) return {} as { [key: string]: ILocalizationBase };
    return this.localizations;
  }

  public getGuildID(): string {
    if (!this.guildID) return '0';
    return this.guildID;
  }

  public isAsyncCommand(): boolean {
    return this.isAsync;
  }

  public isSlash(): boolean {
    return this.isSlashCommand;
  }

  public isLegacy(): boolean {
    return this.isLegacyCommand;
  }

  public isDMAllowed(): boolean {
    return this.allowDM;
  }

  public isLocalizedCommand(): boolean {
    return this.isLocalized;
  }

  public isGlobalCommand(): boolean {
    return this.isGlobal;
  }
}

export class CommandStructure extends CommandStructureBase {
  protected command: () => void;

  constructor(name: string, options: ICommandOptions) {
    super(name, options);

    if (!options.command) throw new Error('Command is not defined');

    this.command = options.command;
    this.isAsync = false;
  }

  public run(): void {
    return this.command();
  }
}

export class AsyncCommandStructure extends CommandStructure {
  protected command: () => Promise<void>;

  constructor(name: string, options: IAsyncCommandOptions) {
    super(name, options);

    if (!options.command) throw new Error('Command is not defined');

    this.command = options.command;
    this.isAsync = true;
  }

  public async run(): Promise<void> {
    return await this.command();
  }
}

export type CommandStructureBased = CommandStructure | AsyncCommandStructure;
