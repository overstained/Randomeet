    
    var express     =  require('express'),
        bodyParser  =  require('body-parser'),
        app         =  express(),
        fs          = require('fs');
        HashMap     = require('hashmap'),
        uuid = require('node-uuid');


    var socketQueue = new HashMap();
        
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended : true
    }));

    var signConst = require('./signaling-constants')();
    var getRemoteUserModel = function(data) {
        return {
            usr: data.usr,
            iq: data.iq,
            gk: data.gk,
            p: data.p,
            pr: data.pr,
            g: data.g,
            a: data.a
        };
    };

    require('./cors-filter')(app);
    require('./signaling-service')(app, signConst);


    var http = require('http').createServer(app).listen(process.env.PORT, function(){
      console.log("Express server listening on port " + process.env.PORT);
    });

    var socketio = require('socket.io')(http);

    var getRoomUsers = function(roomID) {
        return socketio.sockets.adapter.rooms[roomID];
    };

    var disconnectRoom = function (roomID) {
        var users = getRoomUsers(roomID);
        Object.keys(users.sockets).forEach(function(key) {
          socketio.sockets.connected[key].disconnect();
        });          
    };

    socketio.on('connection', function (socket) {
        
        info = socket.handshake.query;
        info.socket = socket;

        socket.on('message', function (message) {
            if(message.remoteOffer) {
                socket.broadcast.to(message.roomID).emit('remoteOffer', message);
            } else if(message.remoteAnswer) {
                socket.broadcast.to(message.roomID).emit('remoteAnswer', message);
            } else if(message.offercandidate) {
                var candidateObj = JSON.parse(message.offercandidate);
                socket.broadcast.to(message.roomID).emit('iceoffercandidate', message);
            } else if(message.handshakeDone) {
                disconnectRoom(message.roomID);
            }
        });

        
        if(!info.roomID) {
            if(socketQueue.count() === 0) {
                var userId = uuid.v1();
                socketQueue.set(userId, info);
            } else {
                 var roomID = uuid.v1();
                 var key = socketQueue.keys()[0],
                     queuedInfo = socketQueue.get(key);
        		 socketQueue.remove(key);
                 socket.join(roomID);
                 queuedInfo.socket.join(roomID);
                 socketio.in(roomID).emit('joinedRoom', {roomID: roomID}); 
        		 socket.to(roomID).emit('owner', {
                    roomMaster: true, 
                    remote: getRemoteUserModel(info)
                 });
        		 queuedInfo.socket.to(roomID).emit('owner', {
                    roomMaster: false,
                    remote: getRemoteUserModel(queuedInfo)
                 });
            }
        } else {
            socket.join(info.roomID);
            var users = getRoomUsers(info.roomID);
            if(users.length === 2) {
                var keys = [];
                for(var k in users.sockets) keys.push(k);
                 socketio.sockets.connected[keys[0]].to(info.roomID).emit('owner', {
                    roomMaster: true
                 });
                 socketio.sockets.connected[keys[1]].to(info.roomID).emit('owner', {
                    roomMaster: false
                 });
            }
        }
        socket.on('disconnect', function() {
            socketQueue.remove(userId);
        });
    });

    