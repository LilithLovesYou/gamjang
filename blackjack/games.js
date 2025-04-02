const games = new Map();

function saveGame(g) {
  games.set(g.playerID, g);
}

function getGame(playerID) {
  return games.get(playerID) || null;
}

function deleteGame(playerID) {
  games.delete(playerID);
}

module.exports = { saveGame, getGame, deleteGame };