/* eslint-disable @typescript-eslint/no-unused-vars */
import { IAsyncCommandOptions, ICommandOptions, ICommandParameter, ILocalizationBase, IDiscordCommandContext } from '../../interfaces';
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';

class CommandStructureBase {
  private name: string;
  private description: string;
  private localizations: { [key: string]: ILocalizationBase } | null;

  protected isAsync?: boolean;
  protected isSlashCommand: boolean;
  protected isLegacyCommand: boolean;
  protected isLocalized: boolean;
  protected allowDM: boolean;
  protected aliases: string[];
  protected parameters: ICommandParameter[];
  protected type: number;
  protected nsfw: boolean;
  protected slashId?: string;

  constructor(name: string, options: ICommandOptions) {
    this.name = this.checkAndFixName(name);
    this.description = options.description ?? '';
    this.isSlashCommand = options.isSlashCommand ?? true;
    this.isLegacyCommand = options.isLegacyCommand ?? true;
    this.allowDM = options.allowDM ?? true;
    this.aliases = options.aliases ?? [];
    this.type = options.type ?? ApplicationCommandType.ChatInput; // Slash Commands only
    this.nsfw = options.nsfw ?? false;

    this.aliases.unshift(this.name);

    if (options.name_localizations || options.description_localizations) {
      this.isLocalized = true;
      this.localizations = {
        'name_localizations': options.name_localizations ?? {},
        'description_localizations': options.description_localizations ?? {},
      };
      if (options.name_localizations) {
        Object.values(options.name_localizations).forEach((aliase) => {
          if (aliase !== this.name) this.aliases.push(aliase);
        });
      }
    } else {
      this.isLocalized = false;
      this.localizations = null;
    }

    if (this.type === ApplicationCommandType.ChatInput && options.parameters) {
      this.parameters = options.parameters;
    } else {
      this.parameters = [];
    }

    var subCommandVerifier = 0;
    var setSubCommandVerifier = (state: number): void => { subCommandVerifier = state; };
    var getSubCommandVerifier = (): number => { return subCommandVerifier; };
    this.parameters.forEach((parameter, index, array) => {
      // check and fix invalid parameters
      array[index] = this.checkAndFixInvalidParameters(parameter, setSubCommandVerifier, getSubCommandVerifier);
    });
  }

  private checkAndFixName(name: string): string {
    if (name.length > 32) throw new Error(`Command name: ${name} is too long (max 32, current: ${name.length})`);
    if (name.length < 1) throw new Error(`Command name: ${name} is too short (min 1, current: ${name.length})`);
    if (name !== name.toLowerCase()) {
      console.warn(`WARNING: Command name: ${name} is not lowercase, converting to lowercase`);
    }
    if (name.includes(' ')) {
      console.warn(`WARNING: Command name: ${name} has spaces, replacing spaces with _`);
    }
    return name.toLowerCase().replace(/ /g, '_');
  }

  private checkAndFixInvalidParameters(
    parameter: ICommandParameter,
    setSubCommandVerifier: (state: number) => void,
    getSubCommandVerifier: () => number,
    insideCommandGround = false,
    insideSubCommand = false,
  ): ICommandParameter {
    // check if there is a type
    if (!parameter) throw new Error('Unexpected Error: Parameter is required, if you are using a subcommand, please make sure that options is an array and not an object');
    if (!parameter.type) throw new Error('Parameter type is required for all parameters, on parameter: ' + (parameter.name ?? 'unknown'));
    if ((insideCommandGround || insideSubCommand) && parameter.type === ApplicationCommandOptionType.SubcommandGroup) throw new Error('Cannot have nested subcommand/group');
    if (((parameter.type === ApplicationCommandOptionType.Subcommand) ||
      (parameter.type === ApplicationCommandOptionType.SubcommandGroup)) &&
      parameter.options!.length > 25) throw new Error('Too many parameters (max 25)');
    // fix subcommands possible errors
    if (insideCommandGround && parameter.type !== ApplicationCommandOptionType.Subcommand) {
      // the user forgot to put his parameters inside a subcommand
      throw new Error(`The parameter: ${parameter.name}, is not a subcommand, but it's inside a subcommand group, please put it inside a subcommand`);
    }

    // Check and fix the parameter name
    if (!parameter.name) throw new Error('Parameter name is required');
    if (parameter.name.length > 32) throw new Error(`Parameter name: ${parameter.name}, is too long (max 32, current: ${parameter.name.length})`);
    parameter.name = parameter.name.toLowerCase();

    // Check an fix nameLocalizations
    if (parameter.name_localizations) {
      Object.keys(parameter.name_localizations).forEach((key) => {
        if (parameter.name_localizations![key].length > 32) {
          throw new Error(`Localized Parameter name: ${parameter.name_localizations![key]}, for parameter: ${parameter.name}, is too long (max 32)`);
        }
        if (parameter.name_localizations![key].length < 1) {
          throw new Error(`Localized Parameter name: ${parameter.name_localizations![key]}, for parameter: ${parameter.name}, is too short (min 1)`);
        }
        parameter.name_localizations![key] = parameter.name_localizations![key].toLowerCase();
      });
    }

    // Check and fix the parameter description
    if (!parameter.description) throw new Error('Parameter description is required for parameter:' + parameter.name);
    if (parameter.description.length > 100) throw new Error(`Parameter description for: ${parameter.name}, is too long (max 100, current: ${parameter.description.length})`);
    if (parameter.description.length < 1) throw new Error(`Parameter description for: ${parameter.name}, is too short (min 1, current: ${parameter.description.length})`);

    // Check and fix descriptionLocalizations
    if (parameter.description_localizations) {
      Object.keys(parameter.description_localizations).forEach((key) => {
        if (parameter.description_localizations![key].length > 100) {
          throw new Error(`Localized Parameter description: ${parameter.description_localizations![key]}, for parameter: ${parameter.name}, is too long (max 100)`);
        }
        if (parameter.description_localizations![key].length < 1) {
          throw new Error(`Localized Parameter description: ${parameter.description_localizations![key]}, for parameter: ${parameter.name}, is too short (min 1)`);
        }
      });
    }

    // Check and fix the parameter types rules
    // String
    if (parameter.type === ApplicationCommandOptionType.String) {
      if (parameter.min_length) parameter.min_length = Math.max(0, Math.min(parameter.min_length, 4000));
      if (parameter.max_length) parameter.max_length = Math.max(1, Math.min(parameter.max_length, 4000));
    } else {
      if (parameter.min_length) delete parameter.min_length;
      if (parameter.max_length) delete parameter.max_length;
    }

    // Integer || Number
    if (parameter.type !== ApplicationCommandOptionType.Integer && parameter.type !== ApplicationCommandOptionType.Number) {
      if (parameter.min_value) delete parameter.min_value;
      if (parameter.max_value) delete parameter.max_value;
    }

    // if its a subcommand group, check all subcommands before returning
    if (parameter.type === ApplicationCommandOptionType.SubcommandGroup || parameter.type === ApplicationCommandOptionType.Subcommand) {
      if (parameter.required !== null) delete parameter.required;
      if (parameter.choices) {
        delete parameter.choices;
        console.warn(`WARNING: Choices are not allowed on subcommands/groups, removed all choices from subcommand/group: ${parameter.name}`);
      }
      if (getSubCommandVerifier() === 2) throw new Error('Cannot have a subcommand/group after an non-subcommand parameter');
      setSubCommandVerifier(1);
      var subCommandVerifier = 0;
      var setSubCommandVerifier = (state: number): void => { subCommandVerifier = state; };
      var getSubCommandVerifier = (): number => { return subCommandVerifier; };
      parameter.options!.forEach((option, index, array) => {
        array[index] = this.checkAndFixInvalidParameters(
          option,
          setSubCommandVerifier,
          getSubCommandVerifier,
          parameter.type === ApplicationCommandOptionType.SubcommandGroup,
          parameter.type === ApplicationCommandOptionType.Subcommand,
        );
      });
    } else {
      if (getSubCommandVerifier() === 1) throw new Error('Cannot have a non-subcommand parameter after a subcommand/group parameter');
      setSubCommandVerifier(2);
      if (parameter.choices) {
        if (parameter.min_length) delete parameter.min_length;
        if (parameter.max_length) delete parameter.max_length;
        if (parameter.min_value) delete parameter.min_value;
        if (parameter.max_value) delete parameter.max_value;
      }
    }
    return parameter;
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
    return this.localizations ?? {};
  }

  public getType(): number {
    return this.type;
  }

  public getParameters(): ICommandParameter[] {
    return this.parameters;
  }

  public getSlashId(): string {
    return this.slashId ?? '';
  }

  public setSlashId(id: string): void {
    if (!this.isSlashCommand) throw new Error('Cannot set slash ID on a non slash command');
    if (this.slashId) throw new Error('Slash ID is already set');
    this.slashId = id;
  }

  public isAsyncCommand(): boolean {
    return this.isAsync ?? false;
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

  public isNSFW(): boolean {
    return this.nsfw;
  }

  public checkPermission(context: IDiscordCommandContext): boolean {
    return true;
  }
}

export class CommandStructure extends CommandStructureBase {
  constructor(name: string, options: ICommandOptions) {
    super(name, options);

    if (options.command) this.execute = options.command;

    this.isAsync = false;
  }

  public run(context: IDiscordCommandContext): void {
    return this.execute(context);
  }

  protected execute(context: IDiscordCommandContext): void {
    throw new Error('Method not implemented.');
  }
}

export class AsyncCommandStructure extends CommandStructure {
  constructor(name: string, options: IAsyncCommandOptions) {
    super(name, options);

    if (options.command) this.execute = options.command;

    this.isAsync = true;
  }

  public async run(context: IDiscordCommandContext): Promise<void> {
    return await this.execute(context);
  }

  protected override async execute(context: IDiscordCommandContext): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export type CommandStructureBased = CommandStructure | AsyncCommandStructure;
