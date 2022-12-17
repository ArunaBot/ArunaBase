import { IncomingMessage } from 'http';
import { HTTPClientBase } from '../../http';

export class HTTPClient extends HTTPClientBase {
  /**
   * post
   */
  public post(version: string, path: string, token: string, body: any = null): Promise<IncomingMessage> {
    return this.sendRequest(`https://discord.com/api/${version}/${path}`, {
      method: 'POST',
      protocol: 'https',
      headers: {
        Authorization: `Bot ${token}`,
      },
      body,
    });
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
      },
      body,
    });
  }
}
