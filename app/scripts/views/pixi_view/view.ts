import { ViewInterface, ModelData, ModelChangeRequest } from "../../interfaces.js";
import { PixiAdapter } from "./pixiAdapter.js";

export class PixiView implements ViewInterface {
  private data: ModelData = {vertices: {}};
  private pixiAdapter: PixiAdapter;

  constructor(div: HTMLDivElement, sendModelChangeRequest: (req: ModelChangeRequest) => void) {
    this.pixiAdapter = new PixiAdapter(div, sendModelChangeRequest);
  }

  public setModelData(newData: ModelData): void {
    const newVertexKeys = Object.keys(newData.vertices);
    const oldVertexKeys = Object.keys(this.data.vertices);

    const removedVertexKeys = oldVertexKeys.filter(key => newVertexKeys.indexOf(key) === -1);
    const addedVertexKeys = newVertexKeys.filter(key => oldVertexKeys.indexOf(key) === -1);
    const sharedVertexKeys = oldVertexKeys.filter(key => newVertexKeys.indexOf(key) !== -1);

    for (const removedVertexKey of removedVertexKeys) {
      this.pixiAdapter.removeVertex(removedVertexKey);
    }

    for (const addedVertexKey of addedVertexKeys) {
      this.pixiAdapter.createVertex(addedVertexKey, newData.vertices[addedVertexKey]);
    }

    for (const sharedVertexKey of sharedVertexKeys) {
      this.pixiAdapter.updateVertex(sharedVertexKey, newData.vertices[sharedVertexKey]);
    }

    this.data = JSON.parse(JSON.stringify(newData));
  }
}
