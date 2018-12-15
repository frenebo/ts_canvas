import { SERVER_REQUEST_PATH } from "../../constants.js";

type IEnforceRequestType<T extends string> = {
  [key in T]: {
    request: {type: T};
  };
};

interface ILayerReqTypes extends IEnforceRequestType<keyof ILayerReqTypes> {
  getConv2dFields: {
    request: {
      type: "getConv2dFields";
      fields: {
        input_shape: number[];
        kernel_size: number[];
        filters: number;
      };
    };
    response: {
      fields: {
        output_shape: number[];
      };
    };
  };
}

type ServerResponse<T extends keyof ILayerReqTypes> = {
  success: true;
  response: ILayerReqTypes[T]["response"];
} | {
  success: false;
  error_type: "bad_request";
  reason: string;
} | {
  success: false;
  error_type: "missing_layer_field";
  reason: string;
} | {
  success: false;
  error_type: "unknown_error";
  reason: string;
} | {
  success: false;
  error_type: "invalid_field";
  field_name: string;
  error_reason: string;
} | {
  success: false;
  error_type: "layer_compute_error";
  reason: string;
};

export class ServerUtils {
  public static makeLayerInfoReq<T extends keyof ILayerReqTypes>(
    req: ILayerReqTypes[T]["request"],
  ): Promise<ServerResponse<T>> {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", SERVER_REQUEST_PATH, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(req));

    return new Promise<ServerResponse<T>>((resolve, reject) => {
      xhr.onreadystatechange = () => {
        // if data isn't fully received
        if (xhr.readyState !== 4) {
          return;
        }

        if (xhr.status === 200) {
          try {
            resolve(ServerUtils.processResponse<T>(xhr.responseText));
          } catch (e) {
            reject(["Failed request", e]);
          }
        } else {
          throw new Error(`Request error no. ${xhr.status}`);
        }
      };
    });
  }

  private static processResponse<T extends keyof ILayerReqTypes>(
    serverResponse: string,
  ): ServerResponse<T> {
    const parsedResponse: ServerResponse<T> = JSON.parse(serverResponse)

    return parsedResponse;
  }
}
