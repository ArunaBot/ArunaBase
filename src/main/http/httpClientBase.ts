import { IncomingMessage, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';

export abstract class HTTPClientBase {
  /**
   * Sends an HTTP/HTTPS request.
   *
   * @param options - The options for the request.
   * @returns A promise that resolves with the response from the server.
   */
  protected async sendRequest(url: string, options: any): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const parsedURL = new URL(url);
      const urlPort = parsedURL.port ? Number(parsedURL.port) : 443;
      const requestOptions = {
        hostname: parsedURL.hostname,
        port: urlPort,
        path: `${parsedURL.pathname}${parsedURL.search}` || '/',
        ...options,
      };
      if (options.protocol.startsWith('https')) requestOptions.protocol = 'https:';
      const request = (options.protocol.startsWith('https') ? httpsRequest : httpRequest)(requestOptions, (response) => { resolve(response); });

      request.on('error', (error) => { reject(error); });

      if (options.body) request.write(options.body);

      request.end();
    });
  }
}
