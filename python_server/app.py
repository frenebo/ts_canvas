import sys
import os
from flask import Flask, send_from_directory, request
from request_processor import process_request_string

# @TODO: Find better way to get directory?
arg_directory = os.path.abspath("../build")
app = Flask(__name__)

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
    process_request_string(request.data)
    return "response text example";
