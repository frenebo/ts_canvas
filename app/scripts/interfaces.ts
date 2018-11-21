
export interface PortData {
  side: "top" | "bottom" | "left" | "right";
  position: number; // 0 to 1
  portType: "input" | "output";
}

export interface VertexData {
  label: string;
  geo: {
    x: number;
    y: number;
    // w: number;
    // h: number;
  };
  ports: {
    [key: string]: PortData;
  };
}

export interface EdgeData {
  sourceVertexId: string;
  sourcePortId: string;
  targetVertexId: string;
  targetPortId: string;
}

export interface ModelData {
  vertices: {
    [key: string]: VertexData;
  };
  edges: {
    [key: string]: EdgeData;
  };
}

export interface ViewInterface {
  setModelData(data: ModelData): void;
}

export interface ModelInterface {
  getModelData(): ModelData;
  addModelChangedListener(listener: () => void): void;
  requestModelChanges(...reqs: ModelChangeRequest[]): void;
  requestModelInfo<T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]): ModelInfoResponseMap[T];
}

document.createElement("div");

export type ModelChangeRequest = {
  type: "moveVertex";
  vertexId: string;
  x: number;
  y: number;
} | {
  type: "cloneVertex";
  newVertexId: string;
  sourceVertexId: string;
  x: number;
  y: number;
} | {
  type: "createEdge",
  newEdgeId: string,
  sourceVertexId: string,
  sourcePortId: string,
  targetVertexId: string,
  targetPortId: string,
} | {
  type: "deleteVertex",
  vertexId: string,
};

export type ModelInfoRequestType = keyof ModelInfoRequestMap & keyof ModelInfoResponseMap;

export interface ModelInfoRequestMap {
  "validateEdge": {
    type: "validateEdge";
    sourceVertexId: string;
    sourcePortId: string;
    targetVertexId: string;
    targetPortId: string;
  };
  "edgesBetweenVertices": {
    type: "edgesBetweenVertices";
    vertexIds: string[];
  }
}

export interface ModelInfoResponseMap {
  "validateEdge": {
    validity: "valid" | "invalid";
  };
  "edgesBetweenVertices": {
    edges: {
      [key: string]: EdgeData;
    };
  }
}
