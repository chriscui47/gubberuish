const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');


const { addUser, getUser, addRoom,rooms} = require('./users');
const { blueDeck, yellowDeck} = require('./wordlist');

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);
games=[]

function tryToStartGame(socket,roomname){
  var clients = io.sockets.adapter.rooms[roomname];
  userlist=[];
  if(clients){
  for(var client in clients.sockets){
    userlist.push(getUser(client));
  }
}
  //we are checking size of last room
  if (!games[roomname]){
    //players in the room should be different
    games[roomname]= {
      users:userlist,
      time:25,
      roundEnd:0,
      deck:0,
      word:{question:'beer bot',answer: 'yeet',hint:'yaa'},
      roomname: roomname
    };
    console.log("We can start the game");

    //let all the people in that room
    io.to(roomname).emit('game', games[roomname]);

  }

}


function timer(socket,roomname){
  setInterval(function(){ 
    games[roomname].time-=1;
    io.to(roomname).emit('game', games[roomname]);
    //if time is up, end the round and restart timer
    if(!games[roomname].roundEnd && games[roomname].time<=0){
      games[roomname].time=6;
      games[roomname].roundEnd=1;
    }
    //answer was~! Then restart timer and the round
    if(games[roomname].roundEnd && games[roomname].time <=0){
      games[roomname].time=25;
      games[roomname].roundEnd=0;
      games[roomname].users.map(user=>user.answered=0);
      
      var randomnumber = Math.floor(Math.random() * (blueDeck.length-1 - 0 + 1)) + 0;
      games[roomname].word=blueDeck[randomnumber];
      //set all users back to not answered
    }
    io.to(roomname).emit('roomData', { room: roomname, users: games[roomname].users });
   },
    1000);


}


const removeUser = (id,room) => {
  const index=games[room].users.find(user=>user.id===id);
  if(index !== -1) {
  games[room].users.splice(index,1)[0];
  return;
  }
}

function getUsersInRoom(room){
  var clients = io.sockets.adapter.rooms[room];
  userlist=[];
  for(var client in clients.sockets){
    userlist.push(getUser(client));
  }
  return userlist;
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


io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

      //figure out in which room this player bellongs
      socket.join(user.room);
      //try to start the game
      tryToStartGame(socket,user.room);

      if(getUsersInRoom(user.room).length===1){
      timer(socket,user.room);
      }

      const existingUser = games[user.room].users.find((user) => user.room === room && user.name === name);
      if(!existingUser){
        games[user.room].users.push(user);
      }

      socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        
        io.to(user.room).emit('message', { user: user.name, text: message });
        if(!games[user.room].word.answer.localeCompare(message)){
          user.answered=1;
          user.score+=10;
          games[user.room].users.sort(GetSortOrder("score"));
        }
        io.to(user.room).emit('roomData', { room: user.room, users: games[user.room].users });

        if(games[user.room].users.every(user=>user.answered===1)){

          games[user.room].roundEnd=1;
          games[user.room].time=7;
        }

        callback();
      });

    io.to(user.room).emit('roomData', { room: user.room, users: games[user.room].users });

  

    callback();
  });


  socket.on('disconnect', () => {
    const user=getUser(socket.id);

    if(user) {
      
    const del=removeUser(user.id,user.room);
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));
module.exports=games;