import { IncomingMessage } from 'http';
import { HTTPClientBase } from '../../http';

export class HTTPClient extends HTTPClientBase {
  /**
   * post
   */
  public async post(version: string, path: string, token: string, body: any = null): Promise<[string | null, number]> {
    const request = await this.sendRequest(`https://discord.com/api/${version}/${path}`, {
      method: 'POST',
      protocol: 'https',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    var data = '';
    request.on('data', (chunk) => {
      data += chunk.toString();
    });
    const waitData = new Promise<[string | null, number]>((resolve) => {
      request.on('end', () => {
        resolve([data, request.statusCode]);
      });
    });
    return await waitData;
  }

  /**
   * delete
   */
  public delete(version: string, path: string, token: string, body: any = null): Promise<IncomingMessage> {
    return this.sendRequest(`https://discord.com/api/${version}/${path}`, {
      method: 'DELETE',
      protocol: 'https',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  }

  /**
   * patch
   */
  public patch(version: string, path: string, token: string, body: any = null): Promise<IncomingMessage> {
    return this.sendRequest(`https://discord.com/api/${version}/${path}`, {
      method: 'PATCH',
      protocol: 'https',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  }
}
