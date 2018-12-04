import { ModelDataObj } from "./model.js";
import { LayerUtils, LayerClassDictJson } from "./layers/layerUtils.js";
import { EdgesByVertex } from "./graphUtils.js";
import { GraphData } from "../../interfaces.js";

export type SessionDataJson = {
  edgesByVertex: EdgesByVertex,
  graph: GraphData,
  layers: LayerClassDictJson,
}
export class SessionUtils {
  public static toJson(data: ModelDataObj): SessionDataJson {
    const jsonData = {
      edgesByVertex: JSON.parse(JSON.stringify(data.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(data.graph)),
      layers: LayerUtils.toJson(data.layers)
    };
    return jsonData;
  }

  public static fromJson(jsonData: SessionDataJson): ModelDataObj {
    const modelData: ModelDataObj = {
      edgesByVertex: JSON.parse(JSON.stringify(jsonData.edgesByVertex)),
      graph: JSON.parse(JSON.stringify(jsonData.graph)),
      layers: LayerUtils.fromJson(jsonData.layers),
    };
    return modelData;
  }
}
