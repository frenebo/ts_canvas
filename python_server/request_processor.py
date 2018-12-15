import json
from layer_field_funcs import get_conv2d_fields, LayerMissingFieldException, InvalidFieldValueException, LayerComputeException

BAD_REQUEST_ERROR_TYPE = "bad_request"
MISSING_FIELD_ERROR_TYPE = "missing_layer_field"
UNKNOWN_ERROR_TYPE = "unknown_error"
INVALID_FIELD_ERROR_TYPE = "invalid_field"
LAYER_COMPUTE_ERROR_TYPE = "layer_compute_error"

def run_layer_request(layer_req):
    if "type" not in layer_req:
        return {
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": "Request is missing request type attribute",
        }

    if "fields" not in layer_req:
        return {
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": "Request is missing layer fields attribute",
        }


    field_funcs = {
        "getConv2dFields": get_conv2d_fields,
    }

    if layer_req["type"] not in field_funcs:
        return {
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": 'Unknown request type "{0}"'.format(layer_req["type"])
        }
    else:
        try:
            out_fields = field_funcs[layer_req["type"]](layer_req["fields"])

            return {
                "success": True,
                "response": {
                    "fields": out_fields,
                },
            }
        except LayerMissingFieldException as e:
            return {
                "success": False,
                "error_type": MISSING_FIELD_ERROR_TYPE,
                "reason": "Missing layer field value: {0}".format(str(e))
            }
        except InvalidFieldValueException as e:
            return {
                "success": False,
                "error_type": INVALID_FIELD_ERROR_TYPE,
                "field_name": e.args[0],
                "error_reason": e.args[1],
            }
        except LayerComputeException as e:
            return {
                "success": False,
                "error_type": LAYER_COMPUTE_ERROR_TYPE,
                "reason": "Layer compute error: {0}".format(str(e)),
            }
        except Exception as e:
            print(e)
            return {
                "success": False,
                "error_type": UNKNOWN_ERROR_TYPE,
                "reason": 'Error calculating field values: {0}'.format(e)
            }
