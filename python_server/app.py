import sys
import os
from flask import Flask, send_from_directory, request
from request_processor import process_request_string
from subprocess import call
from flask_sockets import Sockets

# @TODO: Find better way to get directory?
arg_directory = os.path.abspath("../build")
app = Flask(__name__)
sockets = Sockets(app)

# turn off Flask logging
import logging
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

@app.route("/")
def indexDefaultPath():
    return send_from_directory(arg_directory, "index.html")

@app.route("/<path:path>")
def send_file(path):
    return send_from_directory(arg_directory, path)

@app.route("/server_request", methods = ["POST"])
def post_req():
    return process_request_string(request.data)

@sockets.route("/socket_path")
def socket_req(ws):
    while not ws.closed():
        message = ws.receive()
        ws.send(message)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise Exception("App takes one argument: IP address")
    print(sys.argv[1])
    app.run(host=sys.argv[1], port="5000")
