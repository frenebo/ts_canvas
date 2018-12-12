
export class Queue {
  private readonly queue: Array<() => Promise<unknown>> = [];
  private currentPromise: Promise<unknown> | null = null;

  public async addToQueue<T>(addedFunc: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve) => {
      const modifiedFunc = async () => {
        const promise = addedFunc();
        promise.then((val: T) => {
          resolve(val);
        }).catch((reason) => {
          throw new Error(`Item in queue failed to run: ${reason}`);
        });

        return promise;
      };

      if (this.currentPromise === null) {
        this.setAsCurrentPromise(modifiedFunc());
      } else {
        this.queue.push(modifiedFunc);
      }
    });
  }

  private setAsCurrentPromise(promise: Promise<unknown>): void {
    this.currentPromise = promise;
    this.currentPromise.then(() => {
      if (this.queue.length === 0) {
        this.currentPromise = null;
      } else {
        const nextPromise = this.queue.splice(0, 1)[0];
        this.setAsCurrentPromise(nextPromise());
      }
    }).catch((reason) => {
      throw new Error(`Item in queue failed to run: ${reason}`);
    });
  }
}
