declare module "async-lock" {
  interface AsyncLockOptions {
    timeout?: number;
    maxPending?: number;
    domainReentrant?: boolean;
    Promise?: PromiseConstructor;
  }

  type AsyncLockCallback<T> = () => T | Promise<T>;

  class AsyncLock {
    constructor(opts?: AsyncLockOptions);
    acquire<T>(key: string, fn: AsyncLockCallback<T>): Promise<T>;
    acquire<T>(
      key: string,
      fn: AsyncLockCallback<T>,
      cb: (err: any, ret: T) => void,
    ): void;
    release(key: string): void;
  }

  export default AsyncLock;
}
