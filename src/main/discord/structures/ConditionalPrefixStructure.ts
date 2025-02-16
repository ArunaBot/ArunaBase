import { Message } from 'discord.js';
import { EConditionalPrefixType } from '../../interfaces';

export class ConditionalPrefixStructure {
  constructor(private prefix: string, private conditions: { type: EConditionalPrefixType, value: string }[]) {}

  public testMessage(message: Message): string | null {
    return this.conditions.some((condition) => {
      switch (condition.type) {
        case EConditionalPrefixType.USER:
          return message.author.id === condition.value;
        case EConditionalPrefixType.GUILD:
          return message.guild?.id === condition.value;
        default:
          return false;
      }
    }) ? this.prefix : null;
  }

  public testByRule(type: EConditionalPrefixType, value: string): string | null {
    return this.conditions.some((condition) => {
      return condition.type === type && condition.value === value;
    }) ? this.prefix : null;
  }

  public getPrefix(): string {
    return this.prefix;
  }

  public getConditions(): { type: EConditionalPrefixType, value: string }[] {
    return this.conditions;
  }

  public addCondition(type: EConditionalPrefixType, value: string): void {
    this.conditions.push({ type, value });
  }

  public removeCondition(type: EConditionalPrefixType, value: string): void {
    this.conditions = this.conditions.filter((condition) => {
      return condition.type !== type && condition.value !== value;
    });
  }
}
