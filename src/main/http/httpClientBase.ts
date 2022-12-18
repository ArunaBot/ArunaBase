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
      const urlHost = url.startsWith('http') ? url.split('://')[1].split('/')[0] : url.split('/')[0];
      const urlPath = '/' + url.split('/').slice(url.startsWith('http') ? 3 : 1).join('/');
      const lastColon = urlHost.lastIndexOf(':');
      var urlPort = Number(urlHost.slice(lastColon + 1));
      urlPort = isNaN(urlPort) ? 443 : urlPort;
      const requestOptions = {
        hostname: urlHost,
        port: urlPort,
        path: urlPath || '/',
        ...options,
      };
      if (options.protocol.startsWith('https')) {
        requestOptions.protocol = 'https:';
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
