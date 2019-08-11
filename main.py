import sys
import os
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, send, Namespace
from python_logic.model import Model
# from graph_server_interface import GraphServerInterface
import eventlet
eventlet.monkey_patch()

script_dir = os.path.dirname(os.path.realpath(__file__))
APP_DIRECTORY = os.path.abspath(os.path.join(script_dir, './client/build'))

app = Flask(__name__)
socketio = SocketIO(app)

SOCKET_NAMESPACE_STR = '/socket_path'

# turn off Flask logging
import logging
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

@app.route("/")
def indexDefaultPath():
    return send_from_directory(APP_DIRECTORY, "index.html")

@app.route("/<path:path>")
def send_file(path):
    return send_from_directory(APP_DIRECTORY, path)

class MyCustomNamespace(Namespace):
    def __init__(self, *args):
        super().__init__(*args)

        self._model = Model()

    def on_model_request(self, data):
        # print(data)
        request_id = data["requestId"]
        req = data["request"]
        req_type = req["type"]

        response = None
        changed = False

        if req_type == "request_model_changes":
            self._model.request_model_changes(req["reqs"])
            changed = True
            response = {}
        elif req_type == "request_model_info":
            response = self._model.make_info_request(req["req"])
        elif req_type == "request_versioning_change":
            print("Unimplimented versioning")
            response = {}

        socketio.emit("model_req_response", {
            "request_id": request_id,
            "response": response
        }, namespace=SOCKET_NAMESPACE_STR)

        if changed:
            socketio.emit(
                "graph_changed",
                {
                    "newGraph": self._model.json_serializable_graph(),
                },
                namespace=SOCKET_NAMESPACE_STR
            )

socketio.on_namespace(MyCustomNamespace(SOCKET_NAMESPACE_STR))

if __name__ == "__main__":
    host = '127.0.0.1'
    # host = None
    # if len(sys.argv) == 2:
    #     host = sys.argv[1]
    # else:
    #     host = "0.0.0.0"

    socketio.run(app, host=host, port=8080)
