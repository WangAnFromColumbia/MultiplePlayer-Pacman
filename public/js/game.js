 function Game(canvas, context, socket) {
  this.socket = socket;
  this.canvas = canvas;
  this.context = context;
  this.width = this.canvas.width;
  this.height = this.canvas.height;
  this.players = {};
  this.clientID = null
  this.ghost;
}

Game.prototype.startGame = function() {
  this.socket.emit('start')
  this.listenForKey();
  this.linkToGameServer();
  this.listenForUpdate();
  this.listenForScore();
  this.listenForWaiting();
  this.listenForDisconnect();
}

Game.prototype.addGhost = function() {
  this.ghost = new Ghost();
};

Game.prototype.listenForKey = function() {
  _this = this
  $(document).keydown(function(event){
    var key = event.which;
    if ([37, 38, 39, 40].indexOf(key) > -1) {
      event.preventDefault();  // what's this ?
    }
    _this.socket.emit('keypress', {keypress: key, socket_id: _this.clientID}); //"socket_id: _this.clientID" 好像可以删掉，没用到？
  });
}

Game.prototype.linkToGameServer = function() {
  var _this = this;
  this.socket.on('gameDetails', function(gameID) {
    _this.applyLinkToGame(gameID)
  });
}

Game.prototype.applyLinkToGame = function(gameID) {
  var _this = this;
  this.addGhost();
  this.setClientID(this.socket.io.engine.id); // id 搞来搞去没看明白
  _(gameID.IDs).each(function(id) {
    _this.newPlayer(id)
  });
}

Game.prototype.setClientID = function(uniqueID) {
 return this.clientID = this.clientID || uniqueID; // 这种||运算也没搞懂
}

Game.prototype.newPlayer = function(id) {
  return this.players[id] = new Pacman(id);
}

Game.prototype.listenForUpdate = function() {
  _this = this;
  this.socket.on('update', function(status) {     
    _this.renderAll(status);
  });

};

Game.prototype.renderAll = function (statuses) {
  _this = this;
  this.context.clearRect(0, 0, this.width, this.height); // 每一帧都把整个maze擦了重画 ？？？
  drawGrid(statuses.maze);
  this.ghost.render(statuses.ghost, this.context);
  _(statuses.players).each(function(status) {
    _this.players[status.id].render(_this.context, status)
  }); 

}

Game.prototype.listenForScore = function() {
  this.socket.on('update:score', function(score) {
    $("#point-count").text(score);
  });
}

Game.prototype.listenForDisconnect = function() {
  _this = this;
  var message = 'Your opponent has quit. Please start a new game';
  this.socket.on('opponent:disconnect', function() {
    drawGameStatus(message, _this.context, _this.width, _this.height);
  });
};

Game.prototype.listenForWaiting = function() {
  _this = this;
  var message = "Waiting for your opponent. Prepare your muscles!";
  this.socket.on('waiting', function() {
    drawGameStatus(message, _this.context, _this.width, _this.height);
  });
};


$(document).ready(function(){

  $('#player-name-button').on('click',function(){
    var playerName = $('#player-name-form').val();
    $('#player-name').text('Welcome' + ' ' + playerName);
    $('#player-name-form').hide();
    $('#player-name-button').hide();
    joinGame(playerName)
  });

  function joinGame() {
    var canvas = $("#canvas")[0];  // [0] 什么鬼 ？
    var context = canvas.getContext("2d");
    var socket = io();
    return new Game(canvas, context, socket).startGame();
  }
});


  