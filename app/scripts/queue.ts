
export class Queue {
  private queue: Array<() => Promise<unknown>> = [];
  private currentPromise: Promise<unknown> | null = null;

  private setAsCurrentPromise(promise: Promise<unknown>): void {
    this.currentPromise = promise;
    this.currentPromise.then(() => {
      if (this.queue.length === 0) {
        this.currentPromise = null;
      } else {
        const nextPromise = this.queue.splice(0, 1)[0];
        this.setAsCurrentPromise(nextPromise());
      }
    });
  }

  public addToQueue<T>(addedFunc: () => Promise<T>): Promise<T> {
    return new Promise(resolve => {
      const modifiedFunc = () => {
        const promise = addedFunc();
        promise.then((val: T) => resolve(val));

        return promise;
      }

      if (this.currentPromise === null) {
        this.setAsCurrentPromise(modifiedFunc());
      } else {
        this.queue.push(addedFunc);
      }
    });
  }
}
