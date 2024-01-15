import { Logger } from '@promisepending/logger.js';

export interface IArunaClientConfiguration {
    host: string;
    port: number;
    prefix?: string;
    logger?: Logger;
}
