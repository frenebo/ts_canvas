
const LAYER_OUTPUT_POST_ADDRESS = "calculate_layer_output"

type ServerLayersDict<T extends string> = {
  [key in T]: {
    kerasParameters: unknown;
    layerReturnParams: unknown;
  }
}

interface ServerLayers extends ServerLayersDict<keyof ServerLayers> {
  "Dense": {
    kerasParameters: "input_shape" | "units";
    layerReturnParams: "output_shape";
  };
  "Conv2D": {
    kerasParameters: "input_shape" | "filters" | "kernel_size" | "strides" | "padding" | "dilation_rate";
    layerReturnParams: "output_shape";
  };
}

export class HTTPRequestUtils {
  public static getLayerParams<T extends keyof ServerLayers>(
    layer_type: T,
    parameters: {
      [key in ServerLayers[T]["kerasParameters"]]: string | number[] | number | boolean;
    },
  ): Promise<{
    [key in ServerLayers[T]["layerReturnParams"]]: string;
  }> {
    const http = new XMLHttpRequest();
    http.open("POST", LAYER_OUTPUT_POST_ADDRESS, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    const returnPromise = new Promise<{
      [key in ServerLayers[T]["layerReturnParams"]]: string;
    }>((resolve, reject) => {
      http.onload = (ev) => {
        try {
          resolve(JSON.parse(http.responseText));
        } catch {
          reject();
        }
      }
      http.onerror = (ev) => {
        reject();
        console.log("ERROR", http);
      }
    });

    http.send(JSON.stringify({
      layer_type: layer_type,
      parameters: parameters,
    }));

    return returnPromise;
  }
}
