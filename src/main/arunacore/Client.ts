import { IConfiguration } from './interfaces';
import { ArunaClient } from 'arunacore-api';
import { IClientBase } from '../common';

export class ArunaCoreClient extends ArunaClient implements IClientBase {
  private configuration: IConfiguration;

  constructor(options: IConfiguration) {
    if (!options.prefix) options.prefix = 'arunabase';

    super({ host: options.host, port: options.port, logger: options.logger, id: options.prefix });
    this.configuration = options;
  }

  public async login(secureKey?: string): Promise<unknown> {
    return super.connect(secureKey);
  }

  public getConfiguration(): IConfiguration {
    return this.configuration;
  }

  public getRawClient(): ArunaClient {
    return (this as ArunaClient);
  }
}

export * from 'arunacore-api';
