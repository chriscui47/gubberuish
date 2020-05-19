
const servers = [{ serverid:1,deck:0,roundEnd:0,word:{question: 'drunk beer', answer:'bear',hint:'aa'},time:45 }];

const addServer = ({ roomid,deck}) => {

  roundEnd=false,
  word={question: 'firstword', answer:'bye',hint:'aa'},

  time=30;
  const server = { serverid,deck,roundEnd,word,time };

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

module.exports = { addServer,  getTime,getServer,getRoundEnd,getDeck,getWord };