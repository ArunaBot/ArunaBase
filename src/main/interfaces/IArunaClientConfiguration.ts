import { Logger } from 'arunacore-api';

export interface IArunaClientConfiguration {
    host: string;
    port: number;
    prefix?: string;
    logger?: Logger;
}
