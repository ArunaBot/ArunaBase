import { IncomingMessage, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

export abstract class HTTPClientBase {
  /**
   * Sends an HTTP/HTTPS request.
   *
   * @param options - The options for the request.
   * @returns A promise that resolves with the response from the server.
   */
  protected async sendRequest(url: string, options: any): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      let request;
      const urlPort = url.split(':')[1];
      const urlPath = url.split('/')[1];
      const urlHost = url.split('/')[0];
      const requestOptions = {
        hostname: urlHost,
        port: urlPort || 443,
        path: urlPath || '/',
        ...options,
      };
      if (options.protocol.startsWith('https')) {
        request = httpsRequest(requestOptions, (response) => {
          resolve(response);
        });
      } else {
        request = httpRequest(requestOptions, (response) => {
          resolve(response);
        });
      }

      request.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        request.write(options.body);
      }

      request.end();
    });
  }
}
