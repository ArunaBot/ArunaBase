import { ButtonStructure } from '../structures';
import { ButtonListener } from '../listeners';
import { DiscordClient } from '../Client';

export class ButtonManager {
  private static instance: ButtonManager;

  private buttonListener!: ButtonListener;
  private buttons: { [key: string]: ButtonStructure } = {};

  constructor(
    private client: DiscordClient,
  ) {
    if (ButtonManager.instance) {
      return ButtonManager.instance;
    }
    ButtonManager.instance = this;

    this.buttonListener = new ButtonListener(this, client);
  }

  public static getInstance(client?: DiscordClient): ButtonManager {
    if (!ButtonManager.instance) {
      if (!client) throw new Error('Client is required to create a new instance');
      ButtonManager.instance = new ButtonManager(client);
    }

    return ButtonManager.instance;
  }

  public registerButton(button: ButtonStructure): void {
    this.buttons[button.getID()] = button;
  }

  public registerButtons(buttons: ButtonStructure[]): void {
    for (const button of buttons) {
      this.registerButton(button);
    }
  }

  public getButton(id: string): ButtonStructure | undefined {
    return this.buttons[id];
  }

  public unregisterButton(id: string): void {
    delete this.buttons[id];
  }

  public getButtons(): { [key: string]: ButtonStructure } {
    return this.buttons;
  }

  public getClient(): DiscordClient {
    return this.client;
  }
}
