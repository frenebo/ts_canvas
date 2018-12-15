import sys
import os
from flask import Flask, send_from_directory, request
from request_processor import process_request_string
from flask_socketio import SocketIO, send, emit, Namespace
import json
from graph_server_interface import GraphServerInterface

script_dir = os.path.dirname(os.path.realpath(__file__))
APP_DIRECTORY = os.path.abspath(os.path.join(script_dir, '../client/build'))

app = Flask(__name__)
socketio = SocketIO(app)

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

@app.route("/server_request", methods = ["POST"])
def post_req():
    return process_request_string(request.data)

server_interface = GraphServerInterface()

namespaces = {}

class MyCustomNamespace(Namespace):
    def on_connect(self):
        # print("connect")
        pass

    def on_disconnect(self):
        # print("ondisconnect")
        pass

    def on_model_request(self, data):
        server_interface.send_model_req(request.sid, data)

namespace = MyCustomNamespace('/socket_path')
namespaces["a"] = namespace
socketio.on_namespace(namespace)
# @socketio.on("model_request", namespace="/socket_path")
# def handle_model_request(message):
#     print("Model request: ", message)

if __name__ == "__main__":
    # if len(sys.argv) != 2:
        # raise Exception("App takes one argument: IP address")
    # print(sys.argv[1])
    socketio.run(app)
    # app.run(host=sys.argv[1], port="5000")
