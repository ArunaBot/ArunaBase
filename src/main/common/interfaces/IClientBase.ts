export interface IClientBase {
  getConfiguration(): unknown;
  getRawClient(): unknown;
  login(...args: unknown[]): unknown | Promise<unknown>;
}
