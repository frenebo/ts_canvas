import sys
import os
from flask import Flask, send_from_directory, request
from keras_layer_shape_utils import get_out_params, LayerComputeException, LayerParameterException
import json

def kerasZMEServer():
    assert isinstance(sys.argv[1], str), "Assert argument of string type"
    arg_directory = os.path.abspath(sys.argv[1])
    app = Flask(__name__)

    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)


    @app.route("/")
    def indexDefaultPath():
        return send_from_directory(os.path.join(arg_directory), "index.html")

    @app.route('/<path:path>')
    def send_file(path):
        print(path)
        return send_from_directory(os.path.join(arg_directory), path)

    @app.route('/calculate_layer_output', methods = ['POST'])
    def post_data():
        parsed_args = None
        try:
            parsed_args = json.loads(request.data)
        except json.decoder.JSONDecodeError:
            return json.dumps({
                "type": "request_parse_error",
            })

        try:
            results = get_out_params(parsed_args["layer_type"], parsed_args["parameters"])
        except LayerComputeException as e:
            return json.dumps({
                "type": "layer_compute_error",
                "reason": e.message,
            })
        except LayerParameterException as e:
            return json.dumps({
                "type": "layer_parameter_error",
                "parameter_name": e.field_name,
                "reason": e.message,
            })
        except Exception as e:
            return json.dumps({
                "type": "layer_compute_error",
                "reason": "Error computing layer outputs",
            })

        return json.dumps({
            "type": "success",
            "output": results,
        })
    # app.debug = True
    app.run(host='0.0.0.0')

if __name__ == "__main__":
    kerasZMEServer()
