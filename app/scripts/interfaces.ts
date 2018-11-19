
export interface PortData {
  side: "top" | "bottom" | "left" | "right";
  position: number; // 0 to 1
}

export interface VertexData {
  geo: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  ports: {
    [key: string]: PortData;
  };
}

export interface EdgeData {
  source_vtx: string;
  target_vtx: string;
  source_port: string;
  target_port: string;
}

export interface ModelData {
  vertices: {
    [key: string]:VertexData;
  };
  // edges: {
  //   [key: string]: EdgeData;
  // };
}

export interface ViewInterface {
  setModelData(data: ModelData): void;
}

export interface ModelInterface {
  getModelData(): ModelData;
}
