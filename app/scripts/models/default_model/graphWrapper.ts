import { ModelData } from "../../interfaces";

export class Graph {
  private modelData: ModelData;

  constructor() {
    this.modelData = {
      vertices: {
        // "someVertex": {
        //   label: "Default Layer",
        //   geo: {
        //     x: 100,
        //     y: 100,
        //   },
        //   ports: {},
        // }
      },
    };
    for (let i = 0; i < 100; i++) {
      this.modelData.vertices[i.toString()] = {
        label: i.toString(),
        geo: {
          x: i*5,
          y: i*5,
        },
        ports: {
          "input0": {
            side: "top",
            position: 0.5,
            portType: "input",
          },
          "outpot0": {
            side: "bottom",
            position: 0.5,
            portType: "output",
          }
        }
      }
    }
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

  public createEdge(sourceVtxId: string, sourcePortId: string, targetVtxId: string, targetPortId: string): void {
    const edgeIsValid = this.validateEdge(sourceVtxId, sourcePortId, targetVtxId, targetPortId);
    if (!edgeIsValid) throw new Error(`Invalid create edge arguments: ${arguments}`);

    console.log("Edges unimplmented");
  }

  public validateEdge(sourceVtxId: string, sourcePortId: string, targetVtxId: string, targetPortId: string): boolean {
    const sourceVertex = this.modelData.vertices[sourceVtxId];
    const targetVertex = this.modelData.vertices[targetVtxId];
    if (sourceVertex === undefined || targetVertex === undefined) return false;

    const sourcePort = sourceVertex.ports[sourcePortId];
    const targetPort = targetVertex.ports[targetPortId];

    if (sourcePort === undefined || targetPort === undefined) return false;

    if (sourcePort.portType !== "output") return false;
    if (targetPort.portType !== "input") return false;

    // @TODO check for loops in graph

    return true;
  }
}
