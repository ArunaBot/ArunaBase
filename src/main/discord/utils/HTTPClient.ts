import { HTTPClientBase } from '../../http';

export class HTTPClient extends HTTPClientBase {
  private async makeRequest(method: string, version: string, path: string, token: string, body: any = null): Promise<[string | null, number]> {
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
    const waitData = new Promise<[string | null, number]>((resolve) => {
      request.on('end', () => {
        resolve([data, request.statusCode]);
      });
    });
    return await waitData;
  }

  /**
   * post
   */
  public async post(version: string, path: string, token: string, body: any = null): Promise<[string | null, number]> {
    return this.makeRequest('POST', version, path, token, body);
  }

  /**
   * delete
   */
  public async delete(version: string, path: string, token: string, body: any = null): Promise<[string | null, number]> {
    return this.makeRequest('DELETE', version, path, token, body);
  }

  /**
   * patch
   */
  public async patch(version: string, path: string, token: string, body: any = null): Promise<[string | null, number]> {
    return this.makeRequest('PATCH', version, path, token, body);
  }
}
