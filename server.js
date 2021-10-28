// source: https://gist.github.com/aolde/8104861
// simple http server for temporary testing

import http from "http";
import url from "url";
import path from "path";
import fs from "fs";
	
var port = process.argv[2] || 8888;
var mimeTypes = {
		"html": "text/html",
		"jpeg": "image/jpeg",
		"jpg": "image/jpeg",
		"png": "image/png",
		"svg": "image/svg+xml",
		"json": "application/json",
		"js": "text/javascript",
		"css": "text/css"
	};

http.createServer(function (request, response) {

	var uri = url.parse(request.url).pathname
	var filename = path.join(process.cwd() + '/dist/', uri);

	fs.exists(filename, function (exists) {
		if (!exists) {
			response.writeHead(404, { "Content-Type": "text/plain" });
			response.write("404 Not Found\n");
			response.end();
			return;
		}

		if (fs.statSync(filename).isDirectory())
			filename += '/index.html';

		fs.readFile(filename, "binary", function (err, file) {
			if (err) {
				response.writeHead(500, { "Content-Type": "text/plain" });
				response.write(err + "\n");
				response.end();
				return;
			}

			var mimeType = mimeTypes[filename.split('.').pop()];

			if (!mimeType) {
				mimeType = 'text/plain';
			}

			response.writeHead(200, { "Content-Type": mimeType });
			response.write(file, "binary");
			response.end();
		});
	});
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");