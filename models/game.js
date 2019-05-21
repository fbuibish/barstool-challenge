const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
  gameId: String,
  gameData: Object,
  lastTimeChecked: Date,
});

const gameModel = mongoose.model('game', GameSchema);

module.exports = gameModel;
