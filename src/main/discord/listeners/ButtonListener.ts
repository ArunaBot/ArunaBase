import { Events, Interaction } from 'discord.js';
import { DiscordClient } from '../Client';
import { ButtonManager } from '../managers';

export class ButtonListener {
  constructor(
    private manager: ButtonManager,
    private client: DiscordClient,
  ) {
    this.client.on(Events.InteractionCreate, this.onInteractionCreate.bind(this));
  }

  private async onInteractionCreate(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const button = this.manager.getButton(interaction.customId);
    if (!button) return;

    button.execute(interaction);
  }
}
