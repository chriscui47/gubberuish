
/*

const servers = [{ serverid:1,users:[],deck:0,roundEnd:0,word:{question: 'drunk beer', answer:'bear',hint:'aa'},time:45 }];

const addServer = ({ roomid,deck}) => {

  roundEnd=false,
  word={question: 'firstword', answer:'bye',hint:'aa'},

  time=30;
  users=[];
  const server = { serverid,users,deck,roundEnd,word,time };

  servers.push(server);

  return { server };
}


const getServer= (id) => servers.find((server) => server.serverid === id);


const getTime = (id) => {
  const index = servers.findIndex((server) => server.serverid === id);

  if(index !== -1) return servers[index].time;
}

const getRoundEnd = (id) => {
  const index = servers.findIndex((server) => server.serverid === id);

  if(index !== -1) return servers[index].roundEnd;
}

const getDeck = (id) => {
  const index = servers.findIndex((server) => server.serverid === id);

  if(index !== -1) return servers[index].deck;
}

const getWord = (id) => {
  const index = servers.findIndex((server) => server.serverid === id);

  if(index !== -1) return servers[index].word;
}

*/
const games = require('./index');

var lastRoom = 'default'; //this is the first created room
rooms=[]

function addRoom(roomname){
  rooms.push(roomname);
}




const users = [];

const addUser = ({ id, name, room }) => {
  name = name.trim().toLowerCase();
  room = room.trim().toUpperCase();
  const existingUser = users.find((user) => user.room === room && user.name === name);
  //if(existingUser) return { error: 'Username is taken.' };

  if(!name || !room) return { error: 'Username and room are required.' };
  let answered=0;
  let score=0;
  let host=0;
  const user = { id, name, room,answered,score };
  users.push(user);

  return { user };
}

const addUser2 = ({ id, name,socket }) => {
  name = name.trim().toLowerCase();
  //const existingUser = users.find((user) => user.room === room && user.name === name);
  //if(existingUser) return { error: 'Username is taken.' };

  if(!name) return { error: 'Username required.' };
  let answered=0;
  let score=0;
  let host=1;
  let room='';
  const user = { id,room,name,answered,score,socket };
  users.push(user);

  return { user };
}


const getUser = (id) => users.find((user) => user.id === id);

module.exports = { addUser, getUser, addRoom,rooms,users,addUser2};