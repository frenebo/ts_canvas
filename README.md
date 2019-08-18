# ts_canvas

Demo video: https://www.youtube.com/watch?v=CwIG4Is1iIk&feature=youtu.be

Run gulp build (using gulp-cli installed globally with npm), then run the main.py script.

The app should be accessible at:
http://localhost:5000

Note: Not meant to be used with multiple clients open at the same time.
The client creates a random request id, then sends a request with that id to the server,
which sends back to the client (or all clients if multiple are connected to the server) a response
with the id of the request it's responding to. There's nothing stopping two clients from
happening to send requests with the same id, then treating a response to the other client as if
it's a response to its own request.

With typedoc, you can run "typedoc --out path/to/documentation ./client --target ES6 --tsconfig ./client/tsconfig.json --exclude node_modules --theme minimal" in the root directory to generate documentation
