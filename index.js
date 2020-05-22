const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

var bodyParser = require("body-parser");

const { addUser, getUser, addRoom,rooms} = require('./users');
const { blueDeck, yellowDeck,redDeck,mixDeck} = require('./wordlist');
const app = express();

app.use(function(req, res, next) {
  var allowedOrigins = ['http://localhost:5000', 'http://localhost:3000', 'https://playgibberish.com/', 'https://gibb47.herokuapp.com/,https://playgibberish.com/lobby'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const router = require('./router');
const {users} = require('./users');


const server = http.createServer(app);
const io = socketio(server);

app.use(router);
games=[]


function timer(roomname){
  setInterval(function(){ 
    if(!games[roomname]){
      return;
    }
    games[roomname].time-=1;
    io.to(roomname).emit('game', games[roomname]);
    //if time is up, end the round and restart timer
    if(!games[roomname].roundEnd && games[roomname].time<=0){
      games[roomname].time=6;
      games[roomname].roundEnd=1;
      games[roomname].roundCurrent+=1;
    }
    //answer was~! Then restart timer and the round
    if(games[roomname].roundEnd && games[roomname].time <=0){
      games[roomname].time=20;
      games[roomname].roundEnd=0;
      games[roomname].users.map(user=>user.answered=0);
      if(games[roomname].roundCurrent>=games[roomname].roundTotal){
          io.to(roomname).emit('winner',"done");
      }
      changeWord(roomname,games[roomname].deck)
      //set all users back to not answered
    }
    io.to(roomname).emit('roomData', { room:roomname, users: games[roomname].users,game:games[roomname] });


   },
    1000);


}

const removeUser = (id,room) => {
  const index=games[room].users.find(user=>user.id===id);

  if(index !== -1) return games[room].users.splice(index,1)[0];

}

const changeWord = (room,deck) => {
  let decktype;
  switch(deck){
    case 'Yellow (Pop Culture)':
      decktype=yellowDeck;

    break;
    case 'Blue (Party)':
      decktype=blueDeck;
      break;
    case 'Red (Kinky)':
      decktype=redDeck;
    break;
    case 'Mix of all decks (recommended)':
      decktype=mixDeck;
      break;

  }
  var randomnumber = Math.floor(Math.random() * (decktype.length-1 - 0 + 1)) + 0;
  
  if(games[room]){
    games[room].word=decktype[randomnumber];
    return;
  }

}

function getUsersInRoom(room){
  var clients = io.sockets.adapter.rooms[room];
  userlist=[];
  if(clients){
        for(var client in clients.sockets){
          userlist.push(getUser(client));
        }

        return userlist;
      }
      return;
  }


  function GetSortOrder(score) {    
    return function(a, b) {    
        if (a[score] > b[score]) {    
            return -1;    
        } else if (a[score] < b[score]) {    
            return 1;    
        }    
        return 0;    
    }    
  }    


  
function tryToStartGame(room,gameLength,deck,rounds){
  /*
  var clients = io.sockets.adapter.rooms[room];
  userlist=[];
  if(clients){
  for(var client in clients.sockets){
    userlist.push(getUser(client));
    }
  
  }
  */
  //we are checking size of last room
    console.log("creating lobby");
    //players in the room should be different
    games[room]= {
      users:[],
      time:gameLength,
      roundEnd:0,
      roundTotal:rounds,
      roundCurrent:1,
      deck:deck,
      word:{question:'',answer: '',hint:''},
      roomname: room
    };
    changeWord(room,deck);
  return true;

}

  var foo = function(room,gameLength,deck,rounds) {
      //try to start the game
      rounds=parseInt(rounds);
      gameLength=parseInt(gameLength);
    room = room.trim().toUpperCase();

      tryToStartGame(room,gameLength,deck,rounds);
      timer(room);
    
  };
  
  app.post('/create', function(req, res) {
  //  body= JSON.parse(req);
    let body=(req.body);  
    (foo(body.room,body.gameLength.substring(0,2),body.deck,body.rounds.substring(0,2)));
    res.send({data:true})
    // sending a response does not pause the function
  });





io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {

    const { error, user } = addUser({ id: socket.id, name, room });
    
    socket.join(user.room);
    if(error) return callback(error);
    games[room].users.push(user)
    socket.broadcast.to(room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: games[room].users,game:games[room] });

    callback();
  });


  socket.on('sendMessage', (message,room, callback) => {    
    const user=getUser(socket.id);
    io.to(room).emit('message', { user: user.name, text: message });
    if(!games[room].word.answer.localeCompare(message)){
      user.answered=1;
      user.score+=games[user.room].time;
      games[user.room].users.sort(GetSortOrder("score"));
    }
    io.to(user.room).emit('roomData', { room: user.room, users: games[room].users,game:games[room] });

    if(games[room].users.every(user=>user.answered===1)){

      games[room].roundEnd=1;
      games[room].roundCurrent+=1;
      games[room].time=7;
    }

    callback();
  });


  socket.on('disconnect', () => {
    const user=getUser(socket.id);

    if(user) {
          
        

    const del=removeUser(user.id,user.room);
    socket.leave('room');

    if(games[user.room]){
      if(games[user.room].users.length===0){
        games.splice(user.room,1);
        console.log("game deleted");
      }
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }

  }
    
    
  })
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));
module.exports=games;