import { EmbedBuilder } from 'discord.js';

export class RichEmbed extends EmbedBuilder {
  public addBlakField(inline = false): this {
    return this.addFields({ name: '\u200B', value: '\u200B', inline });
  }

  public addField(name: string, value: string, inline = false): this {
    return this.addFields({ name, value, inline });
  }
}

export class CloneableRichEmbed extends RichEmbed {
  public clone(): CloneableRichEmbed {
    return new CloneableRichEmbed(this.toJSON());
  }
}
