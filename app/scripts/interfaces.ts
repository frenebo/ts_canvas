
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
  setGraphData(data: GraphData): void;
}

export type DeepReadonly<T extends {}> = Readonly<{
  [P in keyof T]: T[P] extends {} ? DeepReadonly<T[P]> : T[P];
}>;

export interface ModelInterface {
  getGraphData(): Promise<DeepReadonly<GraphData>>;
  onDataChanged(listener: () => void): void;
  requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void>;
  requestModelVersioningChange(req: ModelVersioningRequest): Promise<void>;
  requestModelInfo<T extends keyof ModelInfoReqs>(req: ModelInfoReqs[T]["request"]): Promise<ModelInfoReqs[T]["response"]>;
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
}

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

type ReqMapType<T extends string> = {
  [key in T]: {
    request: unknown;
    response: unknown;
  }
}
export interface ModelInfoReqs extends ReqMapType<keyof ModelInfoReqs> {
  "validateEdge": {
    "request": {
      type: "validateEdge";
      edgeId: string;
      sourceVertexId: string;
      sourcePortId: string;
      targetVertexId: string;
      targetPortId: string;
    };
    "response": {
      valid: true;
    } | {
      valid: false;
      problem: string;
    };
  };
  "edgesBetweenVertices": {
    "request": {
      type: "edgesBetweenVertices";
      vertexIds: string[];
    }
    "response": {
      verticesExist: true;
      edges: {
        [key: string]: EdgeData;
      };
    } | {
      verticesExist: false;
      requestNonexistentVertices: string[];
    };
  };
  "fileIsOpen": {
    "request": {
      type: "fileIsOpen";
    };
    "response": {
      fileIsOpen: false;
    } | {
      fileIsOpen: true;
      fileName: string;
      fileIsUpToDate: boolean;
    };
  };
  "savedFileNames": {
    "request": {
      type: "savedFileNames";
    };
    "response": {
      fileNames: string[];
    };
  };
  "getPortInfo": {
    "request": {
      type: "getPortInfo";
      vertexId: string;
      portId: string;
    };
    "response": {
      couldFindPort: true;
      portValue: string;
    } | {
      couldFindPort: false;
    };
  };
  "getLayerInfo": {
    "request": {
      type: "getLayerInfo";
      layerId: string;
    };
    "response": {
      layerExists: true;
      data: LayerData;
    } | {
      layerExists: false;
    }
  };
  "validateValue": {
    "request": {
      type: "validateValue";
      layerId: string;
      valueId: string;
      newValue: string;
    };
    "response": {
      requestError: null;
      invalidError: string | null;
    } | {
      requestError: "layer_nonexistent";
    } | {
      requestError: "field_nonexistent";
      fieldName: string;
    };
  };
  "compareValue": {
    "request": {
      type: "compareValue";
      layerId: string;
      valueId: string;
      compareValue: string;
    };
    "response": {
      requestError: null;
      isEqual: boolean;
    } | {
      requestError: "layer_nonexistent";
    } | {
      requestError: "field_nonexistent"
    };
  }
  "validateLayerFields": {
    "request": {
      type: "validateLayerFields";
      layerId: string;
      fieldValues: {
        [key: string]: string;
      };
    };
    "response":{
      requestError: null;
      errors: string[];
      warnings: string[];
    } | {
      requestError: "layer_nonexistent";
    } | {
      requestError: "field_nonexistent";
      fieldName: string;
    };
  }
  "getUniqueEdgeIds": {
    "request": {
      type: "getUniqueEdgeIds";
      count: number;
    };
    "response": {
      edgeIds: string[];
    };
  };
  "getUniqueVertexIds": {
    "request": {
      type: "getUniqueVertexIds";
      count: number;
    };
    "response":{
      vertexIds: string[];
    };
  };
}
