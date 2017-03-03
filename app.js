var util = require('util');
var _ = require('underscore');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Game = require('./lib/game');
var Pacman = require('./lib/pacman');

var port = process.env.PORT || 8080 // ?

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

function Server() {
  this.games = {};
  this.waitingRoom = [];
}

Server.prototype.init = function() {
  _this = this; // 这里把this存起来，这里的this指的就是Server(NOT server)吧

  server.listen(port, function() {
    console.log("Server listening on port "+ port);
    _this.setEventHandlers(); //这里this变了，所以之前要存储_this
  });
}

Server.prototype.setEventHandlers = function() {
  _this = this;
  io.on("connection", function(socket) {
    return _this.onSocketConnection(socket, _this);
  });
};

Server.prototype.onSocketConnection = function(socket, _this) {
  util.log("New player connected" + socket.id);
  socket.on('start', function() { 
      return _this.onNewPlayer(this, _this)
    }
  );   // 为什么是return这个函数，而不是直接执行这个函数？
  socket.on("disconnect", function() {
      return _this.onClientDisconnect(this, _this)
    }
  );
}

Server.prototype.onClientDisconnect = function(socket, _this) {
  util.log("Player has disconnected: " + socket.id);
  _this.waitingRoom.splice(_this.waitingRoom.indexOf(socket.id), 1);
  if (typeof _this.games[socket.id].sockets !== 'undefined') {
    _(_this.games[socket.id].sockets).each(function(socket) {
      socket.emit('opponent:disconnect');
      socket.disconnect();
      delete _this.games[socket.id];
    });
  }
}

Server.prototype.onNewPlayer = function(socket, _this) {
  _this.waitingRoom.push(socket);
  if (_this.waitingRoom.length > 1) {//return _this.startGame(socket);  执行后return 和 直接return这个函数 是一个效果。 蠢！
    _this.startGame(socket); 
    return;
  }
  socket.emit('waiting');
  //return _this.games[socket.id] = new Game();  // return 后面接了个xxx = xxx，还可以这样啊。。 
  _this.games[socket.id] = new Game(); 
  return;
}

Server.prototype.startGame = function(socket) {
  this.games[socket.id] = this.games[this.waitingRoom[0].id]; // 两个user(两个socket.id)对应的是同一个Game() !!!
  this.addPlayers(this.games[socket.id]); // 传入参数为这2个人的Game()
}

Server.prototype.addPlayers = function(game) {
  for (var i = 0; i < this.waitingRoom.length; i++) { // 总共就2人，这代码可能是抄某些多人联机游戏的代码的
   game.newPlayer(this.waitingRoom[i]);
  }
  this.waitingRoom = [];
  return game.init();
}

new Server().init()
