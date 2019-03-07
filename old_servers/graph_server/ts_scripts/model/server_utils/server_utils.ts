
type IEnforceRequestType<T extends string> = {
  [key in T]: {
    request: {type: T};
  };
};

export interface ILayerReqTypes extends IEnforceRequestType<keyof ILayerReqTypes> {
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

export type ServerResponse<T extends keyof ILayerReqTypes> = {
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

export interface IServerUtils {
  makeLayerInfoReq<T extends keyof ILayerReqTypes>(
    req: ILayerReqTypes[T]["request"],
  ): Promise<ServerResponse<T>>;
}
