import { EHTTP } from '../../common/interfaces';
import { StructuredCommand } from '.';

export interface IEndPointStructure {
  type: EHTTP,
  route: string,
  command?: StructuredCommand | StructuredCommand[],
  callback?: (requestResult: unknown) => void,
}
