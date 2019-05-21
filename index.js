const express = require('express');
const app = express();
const port = 3000;
const dBURL = "mongodb://localhost/barstoolchallenge";

const mongoose = require('mongoose');
const request = require('request');

const Game = require('./models/game');

mongoose.connect(dBURL, { useNewUrlParser: true });

mongoose.connection.on('error', function(err) {
  return console.error('There was a db connection error', err.message);
});

mongoose.connection.on('connected', function() {
  console.log('Successfully connected to ' + dBURL);
});

process.on('SIGINT', function() {
  mongoose.connection.close(function() {
    console.log('dBase connection closed due to app termination');
    return process.exit(0);
  });
});

// Middleware stack
app.use(require('cors')());

mongoose.connection.once('disconnected', function() {
  return console.log('Successfully disconnected from ' + dBURL);
});

app.get('/', (req, res) => {
  return res.send('Hello World');
});

app.get('/:gameId', (req, res) => {
  if (!req.params.gameId) {
    return res.status(401).send('game id invalid');
  }

  const gameId = req.params.gameId;

  Game.findOne({ gameId: gameId }, (err, game) => {
    if (err) { return res.status(500).send('Error retrieving game'); }
    if (!game) {
      findGameData(gameId)
      .then((newGame) => {
        return res.json(newGame);
      }, (error) => {
        return res.status(401).send('Could not find that game');
      })
    }
    else {
      updateGameData(game)
        .then((updatedGame) => {
          return res.json(updatedGame);
        }, (error) => {
          return res.status(500).send('Error updating game data');
        });
    }
  });
});

function findGameData(gameId) {
  return new Promise((resolve, reject) => {
    request(`https://chumley.barstoolsports.com/dev/data/games/${gameId}.json`,
    (error, response, body) => {
      let gameData = {};
      try {
        gameData = JSON.parse(body);
      } catch(e) {
        return reject(e);
      }
      const game = new Game();
      game.gameId = gameId;
      game.gameData = gameData;
      game.lastTimeChecked = Date.UTC();
      game.save((err, savedGame) => {
        if (err) { return reject('Error saving game data'); }

        return resolve(savedGame);
      })
    });
  });
}

function updateGameData(game) {
  const intervalCheck = 15 * 1000;

  return new Promise((resolve, reject) => {
    const now = Date.UTC();
    if (!game.lastTimeChecked || now.getTime() - game.lastTimeChecked.getTime() > intervalCheck) {
      request(`https://chumley.barstoolsports.com/dev/data/games/${game.gameId}.json`,
      (error, response, body) => {
        game.gameData = newGameData
        game.save((err, savedGame) => {
          if (err) { return reject('Error saving game data'); }

          return resolve(savedGame);
        })
      });
    }
    else {
      resolve(game);
    }
  });
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));