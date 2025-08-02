import { Logger } from '@promisepending/logger.js';

export interface IConfiguration {
  host: string;
  port: number;
  prefix?: string;
  logger?: Logger;
}
