
type DragListener = (ev: PIXI.interaction.InteractionEvent) => unknown;

export class DragRegistry {
  private locked: boolean;
  constructor() {
    this.locked = false;
  }

  public register(obj: PIXI.DisplayObject) {

    const dragStartListeners: DragListener[] = [];
    const dragMoveListeners: DragListener[] = [];
    const dragEndListeners: DragListener[] = [];

    let dragging = false;

    const onDragStart = (ev: PIXI.interaction.InteractionEvent) => {
      if (this.locked) return;

      this.locked = true;
      dragging = true;

      for (const listener of dragStartListeners) listener(ev);
    }

    const onDragMove = (ev: PIXI.interaction.InteractionEvent) => {
      if (!dragging) return;

      for (const listener of dragMoveListeners) listener(ev);
    }

    const onDragEnd = (ev: PIXI.interaction.InteractionEvent) => {
      if (!dragging) return;

      dragging = false;
      this.locked = false;

      for (const listener of dragEndListeners) listener(ev);
    }
    obj
      .on('mousedown',       onDragStart)
      .on('touchstart',      onDragStart)
      .on('mouseup',         onDragEnd)
      .on('mouseupoutside',  onDragEnd)
      .on('touchend',        onDragEnd)
      .on('touchendoutside', onDragEnd)
      .on('mousemove',       onDragMove)
      .on('touchmove',       onDragMove);
    return {
      onDragStart: (listener: DragListener) => { dragStartListeners.push(listener); },
      onDragMove: (listener: DragListener) => { dragMoveListeners.push(listener); },
      onDragEnd: (listener: DragListener) => { dragEndListeners.push(listener); },
    }
  }
}
