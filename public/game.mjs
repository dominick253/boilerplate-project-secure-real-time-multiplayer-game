import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

const players = [];
const collectibles = [];

window.onload = function () {
  const canvas = document.getElementById('game-window');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(20, 20, 150, 100);
};

document.addEventListener('keydown', handlePlayerMovement);

function handlePlayerMovement(event) {
  const player = players.find((p) => p.id === socket.id);
  if (!player) return;

  const movementMap = {
    w: { direction: 'up', pixels: 10 },
    s: { direction: 'down', pixels: 10 },
    a: { direction: 'left', pixels: 10 },
    d: { direction: 'right', pixels: 10 },
  };

  const movement = movementMap[event.key];
  if (!movement) return;

  movePlayer(player, movement.direction, movement.pixels);
}

function movePlayer(player, direction, pixels) {
  switch (direction) {
    case 'up':
      player.y -= pixels;
      break;
    case 'down':
      player.y += pixels;
      break;
    case 'left':
      player.x -= pixels;
      break;
    case 'right':
      player.x += pixels;
      break;
    default:
      break;
  }
}

function checkCollisions() {
  const player = players.find((p) => p.id === socket.id);
  if (!player) return;

  const collidedItem = collectibles.find((item) => collision(player, item));
  if (collidedItem) {
    player.score += collidedItem.value;
    removeCollectible(collidedItem);
  }
}


function collision(player, item) {
  return player.collision(item);
}

function removeCollectible(collectible) {
  const index = collectibles.indexOf(collectible);
  if (index !== -1) {
    collectibles.splice(index, 1);
    const { x, y } = generateRandomCoordinates(); // Generate new random coordinates
    addCollectible(); // Add new collectible with new coordinates
  }
}


function generateRandomCoordinates() {
  const maxX = canvas.width - 10;
  const maxY = canvas.height - 10;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  return { x, y };
}

function calculateRank(playersArray) {
  const sortedPlayers = [...playersArray].sort((a, b) => b.score - a.score);
  const currentPlayerIndex = sortedPlayers.findIndex((p) => p.id === socket.id) + 1;
  return `Rank: ${currentPlayerIndex}/${sortedPlayers.length}`;
}

function addPlayer(id, x, y) {
  const player = new Player(id, x, y);
  players.push(player);
}

function removePlayer(id) {
  const index = players.findIndex((p) => p.id === id);
  if (index !== -1) {
    players.splice(index, 1);
  }
}

function generateRandomId() {
  return Math.random().toString(36).substr(2, 9);
}


function addCollectible() {
  const id = generateRandomId(); // Generate a random ID
  const x = Math.random() * (canvas.width - 10);
  const y = Math.random() * (canvas.height - 10);
  const value = 10;
  const collectible = new Collectible(id, value, x, y);
  collectibles.push(collectible);
}



function updateGameState() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  players.forEach((player) => {
    context.fillStyle = 'blue';
    context.fillRect(player.x, player.y, 20, 20);
    context.fillStyle = 'black';
    context.fillText(`Score: ${player.score}`, player.x, player.y - 10);
  });

  collectibles.forEach((collectible) => {
    context.fillStyle = 'green';
    context.fillRect(collectible.x, collectible.y, 10, 10);
  });

  const playerRank = calculateRank(players);
  const rankElement = document.getElementById('player-rank');
  rankElement.textContent = playerRank;

  checkCollisions();
}

function gameLoop() {
  updateGameState();
  requestAnimationFrame(gameLoop);
}

socket.on('connect', () => {
  const { id } = socket;
  const startX = canvas.width / 2;
  const startY = canvas.height / 2;
  addPlayer(id, startX, startY);

  
  
  addCollectible();
});

socket.on('disconnect', () => {
  const { id } = socket;
  removePlayer(id);
});

socket.on('playerMovement', ({ direction, pixels }) => {
  const player = players.find((p) => p.id === socket.id);
  if (player) {
    movePlayer(player, direction, pixels);
  }
});

socket.on('playerDisconnect', ({ id }) => {
  removePlayer(id);
});

socket.on('collectibleAdded', ({ id, value }) => {
  const { x, y } = generateRandomCoordinates(); // Generate random coordinates once
  console.log(x + y)
  addCollectible();
  updateGameState();
});



socket.on('collectibleRemoved', ({ id }) => {
  const collectible = collectibles.find((c) => c.id === id);
  if (collectible) {
    removeCollectible(collectible);
  }
});

gameLoop();
