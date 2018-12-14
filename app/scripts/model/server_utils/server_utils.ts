import { SERVER_REQUEST_PATH } from "../../constants.js";

type IEnforceRequestType<T extends string> = {
  [key in T]: {
    request: {type: T};
  };
};

interface ILayerReqTypes extends IEnforceRequestType<keyof ILayerReqTypes> {
  requestTest: {
    request: {
      type: "requestTest";
    };
    response: {
      "example_val": string;
    };
  };
  getConv2dFields: {
    request: {
      type: "getConv2dFields";
      fields: {
        input_shape: number[];
      };
    };
    response: {
      fields: {
        output_shape: number[];
      };
    };
  };
}

export class ServerUtils {
  public static makeLayerInfoReq<T extends keyof ILayerReqTypes>(
    req: ILayerReqTypes[T]["request"],
  ): Promise<ILayerReqTypes[T]["response"]> {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", SERVER_REQUEST_PATH, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(req));

    return new Promise<ILayerReqTypes[T]["response"]>((resolve, reject) => {
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
  ): ILayerReqTypes[T]["response"] {
    const parsedResponse = JSON.parse(serverResponse);
    if (!parsedResponse.success) {
      throw new Error(`Server reports unsuccessful request: ${parsedResponse.reason}`);
    }

    return parsedResponse.response;
  }
}
