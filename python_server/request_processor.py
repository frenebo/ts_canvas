import json
from layer_field_funcs import get_conv2d_fields

BAD_REQUEST_REASON = "bad_request"


def process_request_string(req_string):
    parsed_req = None

    try:
        parsed_req = json.loads(req_string)
    except json.decoder.JSONDecodeError:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_REASON,
            "reason": "Request json could not be parsed",
        })

    if "type" not in parsed_req:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_REASON,
            "reason": "Request is missing request type attribute",
        })

    if parsed_req["type"] == "requestTest":
        return json.dumps({
            "success": True,
            "response": {
                "example_val": "This is an example value from the server"
            }
        })
    elif parsed_req["type"] == "getConv2dFields":
        return json.dumps({
            "success": True,
            "response": {
                "fields": get_conv2d_fields(parsed_req["fields"]),
            },
        })
    else:
        return json.dumps({
            "success": False,
            "error_type": BAD_REQUEST_REASON,
            "reason": 'Unknown request type "{0}"'.format(parsed_req["type"])
        })
