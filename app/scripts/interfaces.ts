
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
  consistency: "consistent" | "inconsistent";
}

export interface GraphData {
  vertices: {
    [key: string]: VertexData;
  };
  edges: {
    [key: string]: EdgeData;
  };
}

export interface LayerData {
  ports: {
    [key: string]: {
      valueName: string;
    };
  };
  fields: {
    [key: string]: {
      value: string;
      readonly: boolean;
    }
  }
}

export interface ViewInterface {
  setGraphData?(data: GraphData): void;
}

export type DeepReadonly<T extends {}> = Readonly<{
  [P in keyof T]: T[P] extends {} ? DeepReadonly<T[P]> : T[P];
}>;

export interface ModelInterface {
  getGraphData(): DeepReadonly<GraphData>;
  addGraphChangedListener(listener: () => void): void;
  requestModelChanges(...reqs: ModelChangeRequest[]): void;
  requestModelInfo<T extends ModelInfoRequestType>(req: ModelInfoRequestMap[T]): ModelInfoResponseMap[T];
  requestVersioningChange(req: ModelVersioningRequest): void;
}

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
  type: "createEdge";
  newEdgeId: string;
  sourceVertexId: string;
  sourcePortId: string;
  targetVertexId: string;
  targetPortId: string;
} | {
  type: "deleteVertex";
  vertexId: string;
} | {
  type: "deleteEdge";
  edgeId: string;
} | {
  type: "setLayerFields";
  layerId: string;
  fieldValues: {
    [key: string]: string;
  };
};

export type ModelVersioningRequest = {
  type: "undo";
} | {
  type: "redo";
} | {
  type: "saveFile";
  fileName: string;
} | {
  type: "openFile";
  fileName: string;
} | {
  type: "deleteFile";
  fileName: string;
};

export type ModelInfoRequestType = keyof ModelInfoRequestMap & keyof ModelInfoResponseMap;

export interface ModelInfoRequestMap {
  "validateEdge": {
    type: "validateEdge";
    edgeId: string;
    sourceVertexId: string;
    sourcePortId: string;
    targetVertexId: string;
    targetPortId: string;
  };
  "edgesBetweenVertices": {
    type: "edgesBetweenVertices";
    vertexIds: string[];
  };
  "fileIsOpen": {
    type: "fileIsOpen";
  };
  "savedFileNames": {
    type: "savedFileNames";
  };
  "getPortInfo": {
    type: "getPortInfo";
    vertexId: string;
    portId: string;
  };
  "getLayerInfo": {
    type: "getLayerInfo";
    layerId: string;
  };
  "validateValue": {
    type: "validateValue";
    layerId: string;
    valueId: string;
    newValue: string;
  };
  "compareValue": {
    type: "compareValue";
    layerId: string;
    valueId: string;
    compareValue: string;
  };
  "validateLayerFields": {
    type: "validateLayerFields";
    layerId: string;
    fieldValues: {
      [key: string]: string;
    };
  };
  "getUniqueEdgeId": {
    type: "getUniqueEdgeId";
  };
}

export interface ModelInfoResponseMap {
  "validateEdge": {
    valid: true;
  } | {
    valid: false;
    problem: string;
  };
  "edgesBetweenVertices": {
    verticesExist: true;
    edges: {
      [key: string]: EdgeData;
    };
  } | {
    verticesExist: false;
  };
  "fileIsOpen": {
    fileIsOpen: false;
  } | {
    fileIsOpen: true;
    fileName: string;
    fileIsUpToDate: boolean;
  };
  "savedFileNames": {
    fileNames: string[];
  };
  "getPortInfo": {
    couldFindPort: true;
    portValue: string;
  } | {
    couldFindPort: false;
  };
  "getLayerInfo": {
    layerExists: true;
    data: LayerData;
  } | {
    layerExists: false;
  };
  "validateValue": {
    requestError: null;
    invalidError: string | null;
  } | {
    requestError: "layer_nonexistent";
  } | {
    requestError: "field_nonexistent"
  };
  "compareValue": {
    requestError: null;
    isEqual: boolean;
  } | {
    requestError: "layer_nonexistent";
  } | {
    requestError: "field_nonexistent"
  };
  "validateLayerFields": {
    requestError: null;
    errors: string[];
    warnings: string[];
  } | {
    requestError: "layer_nonexistent";
  } | {
    requestError: "field_nonexistent";
    fieldName: string;
  };
  "getUniqueEdgeId": {
    edgeId: string;
  };
}
