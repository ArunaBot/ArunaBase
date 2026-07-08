import { EHTTP } from '../../common/interfaces';
import { StructuredCommand } from '.';

export interface IEndPointStructure {
  type: EHTTP,
  route: string,
  command?: StructuredCommand | StructuredCommand[],
  resolve: (requestResult: unknown) => void,
  reject: (reason: unknown) => void,
}
