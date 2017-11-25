var http = require('http'),
fs = require('fs');

var express = require('express');
var app = http.createServer(function (request, response) {
fs.readFile("manager.html", 'utf-8', function (error, data) {

if(error)
    {
            responce.writeHead(404);
            responce.write("File does not exist");
            responce.end();
    }
    else
    {
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
    }
 });
}).listen(1337);


var io = require('socket.io').listen(app);


var clients = [ ] ;
var socketsOfClients = {};

io.sockets.on('connection', function(socket)
{
    clients[socket.id] = socket;

    socket.on('message_to_server', function(data)
    {
        var destination = clients[data.destinationId];
        if (!destination) {
            return;
        }

    // send a message to the destination
    destination.emit("message_to_client" , { message: data["message"] });
    });
});