import json
from layer_field_funcs import get_conv2d_fields, LayerMissingFieldException, InvalidFieldValueException, LayerComputeException

BAD_REQUEST_ERROR_TYPE = "bad_request"
MISSING_FIELD_ERROR_TYPE = "missing_layer_field"
UNKNOWN_ERROR_TYPE = "unknown_error"
INVALID_FIELD_ERROR_TYPE = "invalid_field"
LAYER_COMPUTE_ERROR_TYPE = "layer_compute_error"

def process_request_string(req_string):
    parsed_req = None

    try:
        parsed_req = json.loads(req_string)
    except json.decoder.JSONDecodeError:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": "Request json could not be parsed",
        })

    if "type" not in parsed_req:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": "Request is missing request type attribute",
        })

    if "fields" not in parsed_req:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": "Request is missing layer fields attribute",
        })


    field_funcs = {
        "getConv2dFields": get_conv2d_fields,
    }

    if parsed_req["type"] not in field_funcs:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_ERROR_TYPE,
            "reason": 'Unknown request type "{0}"'.format(parsed_req["type"])
        })
    else:
        try:
            out_fields = field_funcs[parsed_req["type"]](parsed_req["fields"])

            return json.dumps({
                "success": True,
                "response": {
                    "fields": out_fields,
                },
            })
        except LayerMissingFieldException as e:
            return json.dumps({
                "success": False,
                "error_type": MISSING_FIELD_ERROR_TYPE,
                "reason": "Missing layer field value: {0}".format(str(e))
            })
        except InvalidFieldValueException as e:
            return json.dumps({
                "success": False,
                "error_type": INVALID_FIELD_ERROR_TYPE,
                "field_name": e.args[0],
                "error_reason": e.args[1],
            })
        except LayerComputeException as e:
            return json.dumps({
                "success": False,
                "error_type": LAYER_COMPUTE_ERROR_TYPE,
                "reason": "Layer compute error: {0}".format(str(e)),
            })
        except Exception as e:
            return json.dumps({
                "success": False,
                "error_type": UNKNOWN_ERROR_TYPE,
                "reason": 'Error calculating field values: {0}'.format(e)
            })
