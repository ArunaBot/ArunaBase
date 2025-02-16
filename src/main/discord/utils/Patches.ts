import { Message, OmitPartialGroupDMChannel, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { ButtonStructure } from '../structures';
import { ButtonManager } from '../managers';

declare module 'discord.js' {
  interface Message {
    setButtons(button: ButtonStructure[]): Promise<OmitPartialGroupDMChannel<Message<any>>>;
  }
}

Message.prototype.setButtons = function(buttons: ButtonStructure[]): Promise<OmitPartialGroupDMChannel<Message<any>>> {
  ButtonManager.getInstance().registerButtons(buttons);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.map((b) => b.getButton()));
  return this.edit({ content: this.content, embeds: this.embeds, components: [row] });
};
