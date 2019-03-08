
/** Class used by the culling manager to track the positions of graph items */
export class PositionTracker {
  /**
   * Searches for the position of an item in a sorted array.
   * @param arr - The sorted array
   * @param comparator - A function that returns whether an list item is higher or lower than the search item
   */
  private static binarySearch<T>(arr: T[], comparator: (val: T) => number): number | null {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const middle = Math.floor((left + right) / 2);

      if (comparator(arr[middle]) < 0) {
        left = middle + 1;
      } else if (comparator(arr[middle]) > 0) {
        right = middle - 1;
      } else {
        return middle;
      }
    }

    return null;
  }

  private readonly objCorners: {
    [key: string]: {
      [key in "tl" | "bl" | "tr" |"br"]: {
        x: number;
        y: number;
      };
    };
  } = {};

  /**
   * Constructs a PositionTracker.
   */
  constructor() {
    // empty
  }

  /**
   * Adds an object to the PositionTracker to be tracked.
   * @param key - The key that will be used to refer to the object
   * @param left - The X position of the left side of the object
   * @param right - The X position of the right side of the object
   * @param top - The Y position of the top side of the object
   * @param bottom - The Y position of the bottom side of the object
   */
  public addObject(
    key: string,
    left: number,
    right: number,
    top: number,
    bottom: number,
  ): void {
    const corners = {
      bl: { x: left, y: bottom },
      br: { x: right, y: bottom },
      tl: { x: left, y: top },
      tr: { x: right, y: top },
    };
    // @TODO add tiles to speed things up

    this.objCorners[key] = corners;
  }

  /**
   * Updates the values of an object that already exists in the PositionTracker.
   * @param key - The key used to refer to the object
   * @param newLeft - The new X position of the left side of the object
   * @param newRight - The new X position of the right side of the object
   * @param newTop - The new Y position of the top side of the object
   * @param newBottom - The new Y position of the bottom side of the object
   */
  public updateObject(
    key: string,
    newLeft: number,
    newRight: number,
    newTop: number,
    newBottom: number,
  ): void {
    const oldTop = this.objCorners[key].tl.y;
    const oldLeft = this.objCorners[key].tl.x;
    const oldBottom = this.objCorners[key].br.y;
    const oldRight = this.objCorners[key].br.x;

    if (
      newLeft !== oldLeft ||
      newTop !== oldTop ||
      newRight !== oldRight ||
      newBottom !== oldBottom
    ) {
      this.removeObject(key);
      this.addObject(key, newLeft, newRight, newTop, newBottom);
    }
  }

  /**
   * Removes an object from the PositionTracker
   * @param key - The key used to refer to the object
   */
  public removeObject(key: string): void {
    delete this.objCorners[key];
  }

  /**
   * Gets a Set with the keys of the objects that overlap a box
   * @param boxLeft - The X position of the box's left side
   * @param boxRight - The X position of the box's right side
   * @param boxTop - The Y position of the box's top side
   * @param boxBottom - The Y position of the box's bottom side
   * @returns A set with the keys of objects that overlay with the box
   */
  public whichVerticesOverlapBox(boxLeft: number, boxRight: number, boxTop: number, boxBottom: number): Set<string> {
    return new Set(Object.keys(this.objCorners).filter((k) => {
      return this.doesObjectOverlayBox(k, boxLeft, boxRight, boxTop, boxBottom);
    }));
  }

  /**
   * Determines whether the object with the given key overlaps the box with the given geometry
   * @param objKey - The key used to refer to the object
   * @param boxLeft - The X position of the box's left side
   * @param boxRight - The X position of the box's right side
   * @param boxTop - The Y position of the box's top side
   * @param boxBottom - The Y position of the box's bottom side
   * @returns Whether or not the object does overlap the box
   */
  public doesObjectOverlayBox(
    objKey: string,
    boxLeft: number,
    boxRight: number,
    boxTop: number,
    boxBottom: number,
  ): boolean {
    const objLeft = this.objCorners[objKey].tl.x;
    const objTop = this.objCorners[objKey].tl.y;
    const objRight = this.objCorners[objKey].br.x;
    const objBottom = this.objCorners[objKey].br.y;

    return ((
      (boxLeft <= objLeft && objLeft <= boxRight) ||
      (boxLeft <= objRight && objRight <= boxRight) ||
      (boxTop <= objTop && objTop <= boxBottom) ||
      (boxTop <= objBottom && objBottom <= boxBottom)
    ) || (
      objLeft <= boxLeft &&
      objRight >= boxRight &&
      objTop <= boxTop &&
      objBottom >= boxBottom
    ));
  }
}
