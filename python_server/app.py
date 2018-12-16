import sys
import os
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, send, Namespace
from graph_server_interface import GraphServerInterface
import eventlet
eventlet.monkey_patch()

script_dir = os.path.dirname(os.path.realpath(__file__))
APP_DIRECTORY = os.path.abspath(os.path.join(script_dir, '../client/build'))

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

        self.server_interface = GraphServerInterface()
        self.server_interface.on_graph_change = self.on_graph_change
        self.server_interface.on_request_response = self.on_request_response

    def on_request_response(self, response, request_id):
        obj = {
            "request_id": request_id,
            "response": response,
        }
        socketio.emit("model_req_response", obj, namespace=SOCKET_NAMESPACE_STR)

    def on_graph_change(self):
        socketio.emit("graph_changed", {}, namespace=SOCKET_NAMESPACE_STR)

    def on_model_request(self, data):
        self.server_interface.send_model_req(request.sid, data)

socketio.on_namespace(MyCustomNamespace(SOCKET_NAMESPACE_STR))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise Exception("App takes one argument: host")
    socketio.run(app, host=sys.argv[1], port=5000)
