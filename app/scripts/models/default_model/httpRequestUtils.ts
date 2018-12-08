
const LAYER_OUTPUT_POST_ADDRESS = "calculate_layer_output"

type ServerLayersDict<T extends string> = {
  [key in T]: {
    kerasParameters: unknown;
    layerReturnParams: unknown;
  }
}

export interface LayerInterfaces extends ServerLayersDict<keyof LayerInterfaces> {
  "Dense": {
    kerasParameters: {
      "input_shape": number[],
      "units": number;
    };
    layerReturnParams: {
      "output_shape": number[];
    };
  };
  "Conv2D": {
    kerasParameters: {
      "input_shape": number[];
      "filters": number;
      "kernel_size": number[];
      "strides": number[];
      "padding": "same" | "valid";
      "dilation_rate": number[];
    };
    layerReturnParams: {
      "output_shape": number[];
    };
  };
}

type LayerParamsResponse<T extends keyof LayerInterfaces> = {
  type: "request_parse_error";
} | {
  type: "layer_compute_error";
  reason: string;
} | {
  type: "layer_parameter_error";
  parameter_name: string;
  reason: string;
} | {
  type: "success";
  output: LayerInterfaces[T]["layerReturnParams"];
};

export class HTTPRequestUtils {
  public static getLayerParams<T extends keyof LayerInterfaces>(
    layer_type: T,
    parameters: LayerInterfaces[T]["kerasParameters"],
  ): Promise<LayerParamsResponse<T>> {
    const http = new XMLHttpRequest();
    http.open("POST", LAYER_OUTPUT_POST_ADDRESS, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    const returnPromise = new Promise<LayerParamsResponse<T>>((resolve, reject) => {
      http.onload = (ev) => {
        try {
          resolve(JSON.parse(http.responseText));
        } catch {
          reject();
        }
      }
      http.onerror = (ev) => {
        reject();
        // console.log("ERROR", http);
      }
    });

    http.send(JSON.stringify({
      layer_type: layer_type,
      parameters: parameters,
    }));

    return returnPromise;
  }
}
