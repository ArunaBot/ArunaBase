import express from 'express';

export interface IHTTPServerRoute {
  path: string;
  method: string;
  handler: (request: express.Request, response: express.Response, next: express.NextFunction) => void;
}
