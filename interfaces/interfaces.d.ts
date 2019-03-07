
interface IPortData {
  side: "top" | "bottom" | "left" | "right";
  position: number; // 0 to 1
  portType: "input" | "output";
}

interface IVertexData {
  label: string;
  geo: {
    x: number;
    y: number;
  };
  ports: {
    [key: string]: IPortData;
  };
}

interface IEdgeData {
  consistency: "consistent" | "inconsistent";
  sourceVertexId: string;
  sourcePortId: string;
  targetVertexId: string;
  targetPortId: string;
}

interface IGraphData {
  vertices: {
    [key: string]: IVertexData;
  };
  edges: {
    [key: string]: IEdgeData;
  };
}

interface ILayerData {
  ports: {
    [key: string]: {
      valueName: string;
    };
  };
  fields: {
    [key: string]: {
      value: string;
      fieldIsReadonly: boolean;
    };
  };
}

interface IViewInterface {
  setGraphData(data: IGraphData): void;
}

interface IModelInterface {
  onDataChanged(listener: (newData: IGraphData) => void): void;
  requestModelChanges(...reqs: ModelChangeRequest[]): Promise<void>;
  requestModelVersioningChange(req: ModelVersioningRequest): Promise<void>;
  requestModelInfo<T extends keyof IModelInfoReqs>(
    req: IModelInfoReqs[T]["request"],
  ): Promise<IModelInfoReqs[T]["response"]>;
}

type ModelChangeRequest = {
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

type ModelVersioningRequest = {
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
  };
};

interface IModelInfoReqs extends ReqMapType<keyof IModelInfoReqs> {
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
    };
    "response": {
      verticesExist: true;
      edges: {
        [key: string]: IEdgeData;
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
      data: ILayerData;
    } | {
      layerExists: false;
    };
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
      fieldValidationError: string | null;
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
      requestError: "field_nonexistent";
    };
  };
  "validateLayerFields": {
    "request": {
      type: "validateLayerFields";
      layerId: string;
      fieldValues: {
        [key: string]: string;
      };
    };
    "response": {
      requestError: null;
      errors: string[];
      warnings: string[];
    } | {
      requestError: "layer_nonexistent";
    } | {
      requestError: "field_nonexistent";
      fieldName: string;
    };
  };
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
    "response": {
      vertexIds: string[];
    };
  };
  "valueIsReadonly": {
    "request": {
      type: "valueIsReadonly";
      layerId: string;
      valueId: string;
    };
    "response": {
      requestError: null;
      isReadonly: false;
    } | {
      requestError: null;
      isReadonly: true;
      reason: "port_is_occupied" | "value_is_not_modifiable";
    } | {
      requestError: "layer_nonexistent";
    } | {
      requestError: "field_nonexistent";
    };
  };
  "getGraphData": {
    "request": {
      type: "getGraphData";
    };
    "response": {
      data: IGraphData;
    };
  };
  "getListOfLayers": {
    "request": {
      type: "getListOfLayers";
    };
    "response": {
      layers: Array<{
        layerName: string;
        reasonNotAvailable: null | string;
      }>;
    };
  };
}
