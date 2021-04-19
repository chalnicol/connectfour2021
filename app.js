
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv,{});

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

//serv.listen(2000);
serv.listen(process.env.PORT || 2000);

console.log("Server started.");

var socketList = {};
var playerList = {};
var roomList = {};
var inviteList = {};


class Player {

	constructor (id, username) {
		
		this.id = id;

		this.username = username;

		this.pairingId = Math.floor ( Math.random() * 99999 );

		this.roomId = '';

		this.roomIndex = 0;

		this.chip = 0;

	}

	reset () 
	{
		this.roomId = '';

		this.roomIndex = 0;

		this.chip = 0;

	}

}

class GameRoom {

	constructor ( id, type ) {
		
		this.id = id;

		this.gameType = type; // 0 = no Timer ; 1 = with timer,

		this.turn = 0;

		this.isClosed = false;
		
		this.gridArr = [];

		this.players = [];

		this.isGameOn = false;

	}

	initGame () {

		this.isGameOn = true;

		for ( let i = 0; i < 42; i++ ) {
			this.gridArr.push (0);
		}

	}

	endGame () {

		this.isGameOn = false;

	}

}

class Invite {

	constructor ( id, gameType, host, invitee ) {

		this.id = id;

		this.gameType = gameType;

		this.host = host; 
		
		this.invitee = invitee;

	}

}

io.on('connection', function(socket){
	
	socketList[socket.id] = socket;
	
	socket.on("initUser",  (data) => {
		
		console.log ( '-> new player connected: ', data.username );
		
		let newPlyr = new Player ( socket.id, data.username );

		newPlyr.pid = Math.floor ( Math.random() * 99999 );

		playerList [ socket.id ] = newPlyr;	

		const playersCount = Object.keys(socketList).length;

		socket.broadcast.emit ('playersOnline', { 'playersCount' : playersCount });

	});

	socket.on ('getInitData', () => {
		
		const playersCount = Object.keys(socketList).length;

		const plyr = playerList [ socket.id ];

		socket.emit ('initDataSent', { 'username': plyr.username, 'pairingId': plyr.pairingId, 'playersCount' : playersCount });
		
	});

	socket.on("enterGame", (data) => {
	
		let plyr = playerList [ socket.id ];

		if ( data.game == 0 ) {

			//single player..

			let roomId = plyr.username + '_' + Date.now();

			let newRoom = new GameRoom ( roomId, data.gameType );
				
			newRoom.players.push ( socket.id );

			newRoom.isClosed = true;

			roomList [ roomId ] = newRoom;

			plyr.roomId = roomId;

			const gameRoomData  = {

				'game' : 0,
				'gameType' : 0,
				'players' : {
					'self' : { 'username' : plyr.username, 'chip' : 0 }
				}

			};	

			console.log ( '-> '+ plyr.username +' created a room :', roomId );

			socket.emit ('initGame', gameRoomData ); 

		}else {

			//vs game
			const availableRoom = getAvailableRoom( data.gameType ) ;

			if ( availableRoom == '' ) {

				let roomId = plyr.username + '_' + Date.now();
				
				let newRoom = new GameRoom ( roomId, data.gameType );
				
				newRoom.players.push ( socket.id );

				roomList [ roomId ] = newRoom;

				plyr.roomId = roomId;

				console.log ( '-> '+ plyr.username +' created a room :', roomId );

			}else  {
				
				plyr.roomId = availableRoom;

				plyr.roomIndex = 1;

				plyr.chip = 1;

				let gameRoom = roomList [ availableRoom ];

				gameRoom.players.push ( socket.id );

				gameRoom.isClosed = true;

				console.log ( '-> '+ plyr.username +' joins the room :', gameRoom.id );
				
				//initialize game..
				initGame ( gameRoom.id );
		
			}

		}
		
	});

	socket.on('cancelPairing', () => {

		let plyr = playerList [ socket.id ];

		leaveRoom ( plyr.id );

	});

	socket.on("pair", (data) => {

		let plyr = playerList [socket.id];

		let friend = getPaired ( data.pairingId, socket.id );

		if ( friend != '' ) {

			if ( playerList[ friend ].roomId == '' ) {

				const inviteId = plyr.username + '_' + Date.now()

				let invite = new Invite ( inviteId, data.gameType, plyr.id, friend );

				inviteList [ inviteId ] = invite;

				socketList [ friend ].emit ('pairInvite', { 'gameType' : data.gameType, 'username' : plyr.username });

			}else {

				socket.emit ('pairingError', { 'errorMsg' : 'Friend is not available right now.' } );

			}

		} else {

			socket.emit ('pairingError', { 'errorMsg' : 'Pairing ID submitted does not exist.' } );

		}

	});

	socket.on("pairingResponse", function (data) {

		var player = playerList [socket.id];

		if ( data.response == 0 ) {


		}else {


		}


		if ( roomList.hasOwnProperty ( player.tmpRoom ) ) {

			if ( !data ) {
				
				var room = roomList [ player.tmpRoom ];

				var invitee = room.playerIDs [0];

				leaveRoom ( invitee );

				player.tmpRoom = '';

				socketList [invitee].emit ('pairingError', { error : 0 } );

			} else {

				player.roomid = player.tmpRoom;

				player.index = 1;

				player.type = 1;

				var gameRoom = roomList [ player.roomid ];

				gameRoom.playerIDs.push ( socket.id );

				gameRoom.playerCount += 1;

				initGame ( gameRoom.id );

			}
			

		}else {

			player.tmpRoom = '';
			
			if ( data ) socket.emit ('pairingError', { 'error' : 2 });

		}

		

	});

	socket.on("playerMove", function ( data ) {

		if ( verifyClickSent (socket.id) ) {

			//console.log ('--> Move received from ' + playerList[socket.id].username + ':', data  + '\n' );
			
			var plyr = playerList[socket.id];

			roomList [ plyr.roomid ].setGridTaken ( data );

			var oppoId = getOpponentsId ( socket.id );

			var oppoSocket = socketList [ oppoId ];

			oppoSocket.emit ( 'sendMoveToOpponent', data );

			analyzePlayersMove ( plyr.roomid, data );


		}else {

			console.log ('--> Click received is invalid. \n');
		}

	});
	
	socket.on("playerSendEmoji", function ( data ) {

		var player = playerList [ socket.id ];

		var room = roomList [ player.roomid ];

		for ( var i = 0; i < room.playerCount; i++ ) {

			var plyr =  ( room.playerIDs [i] == player.id ) ? 'self' : 'oppo';
			
			socketList [ room.playerIDs[i] ].emit ( 'showEmoji',  { 'plyr' : plyr, 'frame' : data });

		}

	});

	socket.on("rematchRequest", function () {
		
		var plyr = playerList [ socket.id ]
		
		plyr.isReadyForRematch = true;
		
		if ( bothPlayersRequestsRematch ( plyr.roomid ) ) {

			resetGame ( plyr.roomid );
		}

	});
	
	socket.on("leaveGame", (data) => {
		
		if ( playerList.hasOwnProperty(socket.id) ) {

			let plyr = playerList[socket.id];
			
			console.log ('<- ' + plyr.username + ' has left the game : ' + plyr.roomId );

			if ( plyr.roomId != '' ) leaveRoom (socket.id);

		}

	});
	
	socket.on("disconnect", () => {
			
		if ( playerList.hasOwnProperty(socket.id) ) {

			let plyr = playerList[socket.id];

			console.log ('<- ' + plyr.username + ' has been disconnected');

			if ( plyr.roomId != '' ) leaveRoom ( plyr.id );

			delete playerList [socket.id];

		}

		delete socketList [socket.id];

		const playersCount = Object.keys(socketList).length;

		socket.broadcast.emit ('playersOnline', { 'playersCount' : playersCount });

	});

});



//............



function getPaired ( pairingId, playerId ) {

	for ( var i in playerList ) {

		let player = playerList [i];

		if ( player.pairingId == pairingId && player.id != playerId ) return i;

	}

	return '';

}

function leaveRoom ( playerId ) {

	let player = playerList [ playerId ];

	let gameRoom = roomList [ player.roomId ];

	if ( gameRoom.players.length > 1 ) {

		if ( gameRoom.isGameOn ) gameRoom.endGame ();

		gameRoom.players.splice ( player.roomIndex, 1 );

		const oppSocket = socketList [ gameRoom.players[0] ];

		oppSocket.emit ('opponentLeft', {} );

	} else {

		delete roomList [ player.roomId ];

		console.log ( '-> room deleted :', player.roomId );

	}

	player.reset ();

}

function getAvailableRoom ( gameType ) {

	for ( let i in roomList ) {
		
		let room = roomList [i];

		if ( room.gameType == gameType && !room.isClosed ) return i;
	}

	return '';
}

function initGame ( roomid ) {

	var room = roomList [ roomid ];

	for ( var i = 0; i < 2; i++ ) {

		var self = playerList [ room.players [i] ];

		var oppo = playerList [ room.players [i == 0 ? 1 : 0] ];

		var data = {

			'game' : 1,
			'gameType' : 0,
			'turn' : i == room.turn ? 'self' : 'oppo',
			'players' : {
				'self' : {
					'username' : self.username,
					'chip' : self.chip,
				},
				'oppo' : {
					'username' : oppo.username,
					'chip' : oppo.chip
				}
			}

		};

		var socket = socketList [ self.id ];

		socket.emit ('initGame', data );

	}

	room.initGame();

}

