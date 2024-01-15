import { EHTTP, StructuredCommand } from '.';

export interface IEndPointStructure {
  type: EHTTP,
  route: string,
  command?: StructuredCommand | StructuredCommand[],
  callback?: (requestResult: unknown) => void,
}
