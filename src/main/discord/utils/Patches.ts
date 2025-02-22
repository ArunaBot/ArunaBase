import { Message, OmitPartialGroupDMChannel, ActionRowBuilder, ButtonBuilder, ActionRow, ComponentType } from 'discord.js';
import { ButtonStructure } from '../structures';
import { ButtonManager } from '../managers';

declare module 'discord.js' {
  interface Message {
    setButtons(button: ButtonStructure[]): Promise<OmitPartialGroupDMChannel<Message<any>>>;
  }
}

Message.prototype.setButtons = function(buttons: ButtonStructure[]): Promise<OmitPartialGroupDMChannel<Message<any>>> {
  if (this.components.length > 0) {
    this.components.forEach((component) => {
      if (component instanceof ActionRow) {
        component.components.forEach((c) => {
          if (c.type === ComponentType.Button) {
            ButtonManager.getInstance().unregisterButton(c.customId!);
          }
        });
      }
    });
  }
  ButtonManager.getInstance().registerButtons(buttons);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.map((b) => b.getButton()));
  return this.edit({ content: this.content, embeds: this.embeds, components: [row] });
};
