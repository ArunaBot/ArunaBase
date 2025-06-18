import { ActionRowBuilder, Attachment, BaseMessageOptions, ButtonBuilder } from 'discord.js';
import { ButtonStructure } from './ButtonStructure';
import { RichEmbed } from '../utils';

export class MessageStructure {
  private content: string | null = null;
  private buttons: ButtonStructure[] = [];
  private embeds: RichEmbed[] = [];
  private attachments: Attachment[] = [];

  constructor(content?: string | RichEmbed) {
    if (typeof content === 'string') {
      this.content = content;
    } else if (content instanceof RichEmbed) {
      this.embeds.push(content);
    }
  }

  public setContent(content: string): this {
    this.content = content;
    return this;
  }

  public addEmbed(embed: RichEmbed): this {
    this.embeds.push(embed);
    return this;
  }

  public addEmbeds(embeds: RichEmbed[]): this {
    this.embeds.push(...embeds);
    return this;
  }

  public addAttachment(attachment: Attachment): this {
    this.attachments.push(attachment);
    return this;
  }

  public addAttachments(attachments: Attachment[]): this {
    this.attachments.push(...attachments);
    return this;
  }

  public addButton(button: ButtonStructure): this {
    this.buttons.push(button);
    return this;
  }

  public addButtons(buttons: ButtonStructure[]): this {
    this.buttons.push(...buttons);
    return this;
  }

  public getButtons(): ButtonStructure[] {
    return this.buttons;
  }

  public toDiscordMessage(): BaseMessageOptions {
    const message: BaseMessageOptions = {
      content: this.content ?? undefined,
      embeds: this.embeds.map((embed) => embed.toJSON()),
      files: this.attachments,
      components: this.convertButtons(),
    };

    return message;
  }

  private convertButtons(): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const buttons = this.buttons.map((button) => button.getButton());

    for (let i = 0; i < buttons.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5));
      rows.push(row);
    }

    return rows;
  }
}
