import { HTTPClientBase } from '../../http';
import { IncomingHttpHeaders } from 'http';
import { EHTTP } from '../../interfaces';

export class HTTPClient extends HTTPClientBase {
  public async makeRequest(method: EHTTP, version: string, path: string, token: string, body: any = null): Promise<[string | null, number, IncomingHttpHeaders]> {
    const request = await this.sendRequest(`https://discord.com/api/${version}/${path}`, {
      method: method.toUpperCase(),
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
    const waitData = new Promise<[string | null, number, IncomingHttpHeaders]>((resolve) => {
      request.on('end', () => {
        resolve([data, request.statusCode ?? 200, request.headers]);
      });
    });
    return await waitData;
  }

  /**
   * post
   */
  public async post(version: string, path: string, token: string, body: any = null): Promise<[string | null, number, IncomingHttpHeaders]> {
    return this.makeRequest(EHTTP.POST, version, path, token, body);
  }

  /**
   * delete
   */
  public async delete(version: string, path: string, token: string, body: any = null): Promise<[string | null, number, IncomingHttpHeaders]> {
    return this.makeRequest(EHTTP.DELETE, version, path, token, body);
  }

  /**
   * patch
   */
  public async patch(version: string, path: string, token: string, body: any = null): Promise<[string | null, number, IncomingHttpHeaders]> {
    return this.makeRequest(EHTTP.PATCH, version, path, token, body);
  }

  /**
   * put
   */
  public async put(version: string, path: string, token: string, body: any = null): Promise<[string | null, number, IncomingHttpHeaders]> {
    return this.makeRequest(EHTTP.PUT, version, path, token, body);
  }
}
