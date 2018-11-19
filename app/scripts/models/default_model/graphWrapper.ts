import { ModelData } from "../../interfaces";

export class Graph {
  private modelData: ModelData;

  constructor() {
    this.modelData = {
      vertices: {
        "someVertex": {
          label: "Default Layer",
          geo: {
            x: 100,
            y: 100,
          },
          // ports: {},
        }
      },
    };
  }

  public getModelData(): ModelData {
    return JSON.parse(JSON.stringify(this.modelData));
  }

  public moveVertex(vtxId: string, x: number, y: number): void {
    const vtx = this.modelData.vertices[vtxId];
    if (vtx === undefined) throw new Error(`Could not find vertex with id ${vtxId}`);

    vtx.geo.x = x;
    vtx.geo.y = y;
  }
}
