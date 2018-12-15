from subprocess import Popen, PIPE, STDOUT
import os
import io
from threading import Thread
import json

class GraphServerInterface():
    def __init__(self):
        script_dir = os.path.dirname(os.path.realpath(__file__))
        GRAPH_MAIN_JS_PATH = os.path.abspath(os.path.join(script_dir, "../graph_server/build/main.js"))

        self.node_process = Popen(
            ["node", GRAPH_MAIN_JS_PATH],
            shell=False,
            stdout=PIPE,
            stdin=PIPE,
            # stderr=PIPE,
        )

        t = Thread(target=self.listen_output, args=[])
        t.start()

        self.graph_change_listeners = []
        self.request_response_listeners = []

    def listen_output(self):
        # self.node_process.stdout
        sout = io.open(self.node_process.stdout.fileno(), 'rb', closefd=False)
        while True:
            buf = sout.readline()
            if len(buf) == 0:
                break
            response_obj = json.loads(buf.decode())

            if response_obj["type"] == "data_changed_notification":
                if self.on_graph_change is not None:
                    self.on_graph_change()

            elif response_obj["type"] == "request_response":
                if self.on_request_response is not None:
                    self.on_request_response(response_obj["response"])
            # print(response_obj["type"])

    def send_model_req(self, session_id, data):
        request_contents = {
            "client_id": "asdf",
            "client_message": data,
        }
        self.node_process.stdin.write(json.dumps(request_contents).encode())
        self.node_process.stdin.flush()
