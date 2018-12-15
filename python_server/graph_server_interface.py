from subprocess import Popen, PIPE, STDOUT
import os

class GraphServerInterface():
    def __init__(self):
        script_dir = os.path.dirname(os.path.realpath(__file__))
        GRAPH_MAIN_JS_PATH = os.path.abspath(os.path.join(script_dir, "../graph_server/build/main.js"))

        self.node_process = Popen(
            ["node", GRAPH_MAIN_JS_PATH],
            shell=False,
            # stdout=PIPE,
            stdin=PIPE,
            stderr=PIPE,
        )
        self.node_process.stdin.write("asdfasdf".encode("utf-8"))

    #     self.listen()
    #
    # async def listen(self):
    #     for line in self.node_process.stdout:
    #         print(line)

    def send_model_req(self, session_id, data):
        self.node_process.stdin.write("Data from python".encode('utf-8'))
        # get_stdout = self.node_process.communicate(input='adsjflasdkfj'.encode())[0]
        # print(get_stdout)
        print(session_id, data)
