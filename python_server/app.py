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


class MyCustomNamespace(Namespace):
    def __init__(self, *args):
        super().__init__(*args)

        self.server_interface = GraphServerInterface()
        self.server_interface.on_graph_change = self.on_graph_change
        self.server_interface.on_request_response = self.on_request_response

    def on_request_response(self, response):
        print("request response: ", response)

    def on_graph_change(self):
        print("graph changed")

    def on_connect(self):
        # print("connect")
        pass

    def on_disconnect(self):
        # print("ondisconnect")
        pass

    def on_model_request(self, data):
        self.server_interface.send_model_req(request.sid, data)

socketio.on_namespace(MyCustomNamespace('/socket_path'))
# @socketio.on("model_request", namespace="/socket_path")
# def handle_model_request(message):
#     print("Model request: ", message)

if __name__ == "__main__":
    # if len(sys.argv) != 2:
        # raise Exception("App takes one argument: IP address")
    # print(sys.argv[1])
    socketio.run(app)
    # app.run(host=sys.argv[1], port="5000")
