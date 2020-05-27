const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const { FifoMatchmaker } = require('matchmaking');
var bodyParser = require("body-parser");

const { addUser, getUser, addRoom,rooms,addUser2} = require('./users');
const { blueDeck, yellowDeck,redDeck,mixDeck} = require('./wordlist');
const app = express();


app.use(function(req, res, next) {
  var allowedOrigins = ['http://localhost:5000', 'http://localhost:3000', 'https://playgibberish.com/', 'https://gibb47.herokuapp.com/','https://playgibberish.com/lobby','https://gibberishly.netlify.app/'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //console.log("the origin number os:"+allowedOrigins.indexOf(origin));

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, application/json');
  res.header('Access-Control-Allow-Credentials', true);

  return next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const router = require('./router');
const {users} = require('./users');


const server = http.createServer(app);
//const io = socketio(server);

const io = socketio(server);


app.use(router);
games=[]


function timer(roomname){
  var timerset= setInterval(function(){ 
    if(!games[roomname]){
      return;
    }

    //only update t ime if game is not over
    if(games[roomname].roundCurrent>=games[roomname].roundTotal){
      clearInterval(timerset);
    }
    games[roomname].time-=1;
    

    //if time is up, end the round and restart timer
    if(!games[roomname].roundEnd && games[roomname].time<=0){
      games[roomname].time=6;
      games[roomname].roundEnd=1;
    }
    //answer was~! Then restart timer and the round
    if(games[roomname].roundEnd && games[roomname].time <=0){
      games[roomname].time=games[roomname].maxTime;
      games[roomname].roundEnd=0;
      games[roomname].roundCurrent+=1;
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

  
 try {
  const index=games[room].users.findIndex(user=>user.id===id);

  if(index !== -1) {
    console.log("deleteing user"+getUser(id).name);
    games[room].users.splice(index,1);
    io.to(room).emit('roomData', {users: games[room].users,game:games[room] });
    console.log(games);

  }
  } catch (e) {
          console.error(e.name + ': ' + e.message)
          return;
    }
  
  try {
    const index2=users.findIndex((user) => user.room === room && user.id === id);
    if(index2 !== -1) {
      console.log("deleteing user"+getUser(id).name);
      users.splice(index2,1);    
      io.to(room).emit('roomData', { users: games[room].users,game:games[room] });
      console.log(games);

    }
} catch (e) {
            console.error(e.name + ': ' + e.message)
            return;
      }

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
      maxTime:gameLength,
      roundEnd:-1,
      roundTotal:rounds,
      roundCurrent:1,
      deck:deck,
      word:{question:'',answer: '',hint:''},
      roomname: room
    };
    changeWord(room,deck);
  return true;

}
//foo creates game
  var foo = function(room,gameLength,deck,rounds) {
      //try to start the game
      rounds=parseInt(rounds);
      gameLength=parseInt(gameLength);
    room = room.trim().toUpperCase();
    if(!games[room]){
      tryToStartGame(room,gameLength,deck,rounds);
    }
      
    
  };
  
  app.post('/create', function(req, res) {
  //  body= JSON.parse(req);


  var allowedOrigins = ['http://localhost:5000', 'http://localhost:3000', 'https://playgibberish.com/', 'https://gibb47.herokuapp.com/','https://playgibberish.com/lobby','https://gibberishly.netlify.app/'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
console.log("the origin is:"+origin);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, application/json');
  res.header('Access-Control-Allow-Credentials', true);
    let body=(req.body);  
    (foo(body.room,body.gameLength.substring(0,2),body.deck,body.rounds.substring(0,2)));
    res.send({data:true});

    // sending a response does not pause the function
  });

function getKey(player){
  return player.id;
}
  let mm = new FifoMatchmaker(runGame, getKey,{ checkInterval: 2000,minMatchSize:4,maxMatchSize:8 });

  function makeid(length){
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

  function runGame(players) {
    const roomname = makeid(5);
    console.log("Game started with:"+players);
    foo(roomname,25,"Mix of all decks (recommended)",18);
    //once game starts, put players into match
    players.map(player=>
      {  
        games[roomname].users.push(player);
        player.socket.join(roomname);
        delete player["socket"];
        mm.leaveQueue(player);
        player["room"]=roomname;
      }
    );

  //  console.log(getUsersInRoom(roomname));
    io.to(roomname).emit('roomData', { room: roomname, users: games[roomname].users,game:games[roomname] });
    io.to(roomname).emit('matchFound');
  }




io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if(error) return callback(error);
    console.log(users);
    //if its first user in lobby, make him HOST!
    if(games[room]){
          if(games[room].users.length===0){
            user.host=1;
          }
    }
    socket.join(user.room);
    if(games[room]){
    games[room].users.push(user);
    }
    else{
      return callback(error); 
    }
    socket.broadcast.to(room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: games[room].users,game:games[room] });

    callback();
  });

  socket.on('joinMM', ({ name }, callback) => {
    const { error, user } = addUser2({ id: socket.id, name, socket });
    if(error) return callback(error);
    //if its first user in lobby, make him HOST!
    mm.push(user);
    
  });

  

  socket.on('sendMessage', (message,room, callback) => {    
    const user=getUser(socket.id);
    if(!games[room]){
      return;
    }
    try{
    io.to(room).emit('message', { user: user.name, text: message });
    }
    catch(e){
      console.log(e);
    }
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


  socket.on('playAgain', (room) => {    
    try{
    games[room].time=games[room].maxTime;
    games[room].roundCurrent=1;
    games[room].roundEnd=0;
    timer(room);
    io.to(room).emit('roomData', { room: room, users: games[room].users,game:games[room] });
    io.to(room).emit('restart',"yeet");

    }catch(e){
      console.log(e);
    }

  });

  socket.on('startGame', (room) => {   
    timer(room);
    games[room].roundEnd=0;
  });



  socket.on('disconnect', () => {
    const user=getUser(socket.id);
    if(user) {
      const room1=user.room;

   //   setTimeout(function () {
        const del=removeUser(user.id,user.room);
     // }, 3500);

    socket.leave(user.room);

    io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
    io.to(user.room).emit('roomData', { room: room1, users: getUsersInRoom(room1),game:games[room1]});

    if(games[user.room]){
      if(games[user.room].users.length===0){
        delete games[user.room];
      }
    }

  }
    
    
  })
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));
module.exports=games;