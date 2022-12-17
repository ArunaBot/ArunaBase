import { IArunaClientConfiguration } from '../interfaces';
import { ArunaClient } from 'arunacore-api';

export class ArunaCoreClient extends ArunaClient {
  private configuration: IArunaClientConfiguration;

  constructor(options: IArunaClientConfiguration) {
    if (!options.prefix) options.prefix = 'arunabase';

    super(options.host, options.port, options.prefix, options.logger);
    this.configuration = options;
  }

  public getConfiguration(): IArunaClientConfiguration {
    return this.configuration;
  }

  public getRawClient(): ArunaClient {
    return (this as ArunaClient);
  }
}

export * as ArunaCore from 'arunacore-api';
