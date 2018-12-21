from eventlet.green import subprocess
import os
import io
from threading import Thread
import json
from request_processor import run_layer_request

class GraphServerInterface():
    def __init__(self):
        script_dir = os.path.dirname(os.path.realpath(__file__))

        GRAPH_MAIN_JS_PATH = os.path.abspath(os.path.join(script_dir, "../graph_server/build/main.js"))
        CSHARP_PROJECT_PATH = os.path.abspath(os.path.join(script_dir, "../cs_graph"));

        self.node_process = subprocess.Popen(
            ["dotnet", "run", "--project", CSHARP_PROJECT_PATH, "--no-build"],
            shell=False,
            stdout=subprocess.PIPE,
            stdin=subprocess.PIPE,
        )

        # self.node_process = subprocess.Popen(
        #     ["node", GRAPH_MAIN_JS_PATH],
        #     shell=False,
        #     stdout=subprocess.PIPE,
        #     stdin=subprocess.PIPE,
        #     # stderr=PIPE,
        # )

        t = Thread(target=self.listen_output, args=[])
        t.start()

        self.on_graph_change = None
        self.on_request_response = None

    def listen_output(self):
        for buf in iter(self.node_process.stdout.readline, b''):
            response_obj = json.loads(buf.decode())

            if response_obj["type"] == "data_changed_notification":
                if self.on_graph_change is not None:
                    self.on_graph_change()

            elif response_obj["type"] == "request_response":
                if self.on_request_response is not None:
                    # print(response_obj)
                    self.on_request_response(response_obj["response"], response_obj["request_id"])
            elif response_obj["type"] == "requesting_layer_info":
                response = run_layer_request(response_obj["request"])
                self.send_model_layer_info_response(response, response_obj["request_id"])

    def send_model_layer_info_response(self, response, request_id):
        request_contents = {
            "type": "layer_data_response",
            "response": response,
            "request_id": request_id,
        }
        self.node_process.stdin.write((json.dumps(request_contents) + "\n").encode())
        self.node_process.stdin.flush()

    def send_model_req(self, session_id, data):
        request_contents = {
            "type": "client_request",
            "client_id": "asdf",
            "client_message": data,
        }
        self.node_process.stdin.write((json.dumps(request_contents) + "\n").encode())
        self.node_process.stdin.flush()
