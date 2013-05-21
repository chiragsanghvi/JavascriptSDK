var static = require('node-static');
var fileServer = new static.Server('./public');

require('http').createServer(function (request, response) {
    //request.addListener('end', function () {
        fileServer.serve(request, response);
    //});
}).listen(8084);

console.log("Server started on 8080");
