import { IHTTPServerConfiguration, IHTTPServerRoute } from '../interfaces';
import { match } from 'path-to-regexp';
import express from 'express';
import http from 'http';

export class HTTPServer {
  private app: express.Express;
  private port: number;
  private server: http.Server | null;
  private isSubServer: boolean;
  private options: IHTTPServerConfiguration;
  private registredRoutes: IHTTPServerRoute[];

  constructor(options: IHTTPServerConfiguration, isSubServer = false) {
    this.options = options;
    this.isSubServer = isSubServer;
    this.app = express();
    this.server = null;

    this.app.use(express.json());

    this.port = options.port;

    this.registredRoutes = [];
    this.app.use(this.handleRequest.bind(this));
  }

  private handleRequest(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const route = this.registredRoutes.find((route) => {
      const matchRoute = match(req.path, { decode: decodeURIComponent });
      return (route.method === req.method || route.method === 'all') && matchRoute(req.path);
    });

    if (route) {
      route.handler(req, res, next);
    } else {
      next();
    }
  }

  public start(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.isSubServer) return reject(new Error('A sub server cannot be started!'));
      this.server = this.app.listen(this.port, () => {
        resolve(this.port);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isSubServer) return reject(new Error('A sub server cannot be stopped!'));
      this.server?.close((err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  public createSubRoute(path: string): HTTPServer {
    const subServer = new HTTPServer(this.options, true);
    this.app.use(path, subServer.getApp());
    return subServer;
  }

  public getApp(): express.Express {
    return this.app;
  }

  public getOptions(): IHTTPServerConfiguration {
    return this.options;
  }

  public getRoutes(): IHTTPServerRoute[] {
    return this.registredRoutes;
  }

  public get(path: string, handler: express.RequestHandler): void {
    this.registredRoutes.push({
      method: 'get',
      path,
      handler,
    });
  }

  public post(path: string, handler: express.RequestHandler): void {
    this.registredRoutes.push({
      method: 'post',
      path,
      handler,
    });
  }

  public put(path: string, handler: express.RequestHandler): void {
    this.registredRoutes.push({
      method: 'put',
      path,
      handler,
    });
  }

  public delete(path: string, handler: express.RequestHandler): void {
    this.registredRoutes.push({
      method: 'delete',
      path,
      handler,
    });
  }

  public all(path: string, handler: express.RequestHandler): void {
    this.registredRoutes.push({
      method: 'all',
      path,
      handler,
    });
  }

  public use(path: string, handler: express.RequestHandler): void {
    this.all(path, handler);
  }

  public middleware(handler: express.RequestHandler): void {
    this.all('*', handler);
  }

  public removeRoute(path: string, method: string): void {
    this.registredRoutes = this.registredRoutes.filter((route) => route.path !== path && route.method !== method);
  }
}
