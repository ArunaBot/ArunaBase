import { IArunaClientConfiguration } from '../interfaces';
import { ArunaClient } from 'arunacore-api';

export class ArunaCoreClient extends ArunaClient {
  private configuration: IArunaClientConfiguration;

  constructor(options: IArunaClientConfiguration) {
    if (!options.prefix) options.prefix = 'arunabase';

    super({ host: options.host, port: options.port, logger: options.logger, id: options.prefix });
    this.configuration = options;
  }

  public getConfiguration(): IArunaClientConfiguration {
    return this.configuration;
  }

  public getRawClient(): ArunaClient {
    return (this as ArunaClient);
  }
}

export * from 'arunacore-api';
