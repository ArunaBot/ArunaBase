import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import crypto from 'node:crypto';

export class ButtonStructure {
  protected id: string = crypto.randomUUID();
  protected label: string;
  protected style: ButtonStyle = ButtonStyle.Primary;
  protected emoji?: string;
  protected disabled: boolean = false;

  protected discordButton: ButtonBuilder;

  constructor(
    { label, style, emoji, disabled }: {
      label: string,
      style?: Exclude<ButtonStyle, ButtonStyle.Link>,
      emoji?: string,
      disabled?: boolean,
    },
    private callback?: ((ctx: ButtonInteraction) => void) | ((ctx: ButtonInteraction) => Promise<void>),
  ) {
    this.label = label;
    if (style) {
      // @ts-expect-error - This is used to ensure that Link is not passed in this constructor in non-typescript code
      if (style === ButtonStyle.Link) throw new Error('ButtonStyle.Link is not allowed in this constructor. Use ButtonURLStructure instead');
      this.style = style;
    }
    if (disabled) this.disabled = disabled;

    this.discordButton =
    new ButtonBuilder()
      .setCustomId(this.id)
      .setLabel(this.label)
      .setStyle(this.style)
      .setDisabled(this.disabled);

    if (emoji) {
      this.emoji = emoji;
      this.discordButton.setEmoji(emoji);
    }
  }

  public async execute(ctx: ButtonInteraction): Promise<void> {
    if (this.callback) await this.callback(ctx);
    else await ctx.deferUpdate();
  }

  public setIsDisabled(disabled: boolean): this {
    this.disabled = disabled;
    this.discordButton.setDisabled(disabled);
    return this;
  }

  public setStyle(style: ButtonStyle): this {
    this.style = style;
    this.discordButton.setStyle(style);
    return this;
  }

  public getButton(): ButtonBuilder {
    return this.discordButton;
  }

  public getID(): string {
    return this.id;
  }
}

export class ButtonURLStructure extends ButtonStructure {
  protected url: string;

  constructor({ label, url, emoji, disabled }: { label: string, url: string, emoji?: string, disabled?: boolean }) {
    super({ label, emoji, disabled });
    this.url = url;
    this.setStyle(ButtonStyle.Link);
    this.discordButton.setURL(this.url);
  }
}
