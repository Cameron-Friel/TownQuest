/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tuxemon, https://github.com/Tuxemon/Tuxemon
 */

 // Need a NPC class

 const fountainText = 'You see a reflection of yourself.';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  pixelArt: true,
  id: 'test',
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// dialog box class

class Dialog {
  constructor() {
    this.dialogText;
    this.dialogPersistence = 0;
  }

  setDialogText(event, text) {
    this.dialogText = event.add.text(16, 500, text, {
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 20, y: 10 },
            backgroundColor: "#ffffff",
          }).setScrollFactor(0).setDepth(30);
  }

  updateDialogText(text) {
    this.dialogText.text = text;
  }

  removeDialog() {
    this.dialogText.destroy();
    this.dialogPersistence = 0;
  }
}

const game = new Phaser.Game(config);
let cursors;
let player;
let showDebug = false;

let messageDialog = new Dialog(); // dialog object to handle text on the screen
let itemsDialog = new Dialog(); // displays the items the user has
let players = {}; // players on the map

function preload() {
  this.load.image("tiles", "/public/assets/tilesets/tuxmon-sample-32px-extruded.png");
  this.load.tilemapTiledJSON("map", "/public/assets/tilemaps/tuxemon-town.json");

  // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
  // the player animations (walking left, walking right, etc.) in one image. For more info see:
  //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
  // If you don't use an atlas, you can do the same thing with a spritesheet, see:
  //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
  this.load.atlas("atlas", "/public/assets/atlas/atlas.png", "public/assets/atlas/atlas.json");
}

function create() {
  const map = this.make.tilemap({ key: "map" });

  // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
  // Phaser's cache (i.e. the name you used in preload)
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
  const worldLayer = map.createStaticLayer("World", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });

  // By default, everything gets depth sorted on the screen in the order we created things. Here, we
  // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
  // Higher depths will sit on top of lower depth objects.
  aboveLayer.setDepth(10);

  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

  // Create the player's walking animations from the texture atlas. These are stored in the global
  // animation manager so any sprite can access them.
  const anims = this.anims;
  anims.create({
    key: "misa-left-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-right-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-front-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-back-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });

  const camera = this.cameras.main;

  cursors = this.input.keyboard.createCursorKeys();

  // Help text that has a "fixed" position on the screen
  this.add
    .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0)
    .setDepth(30);

  // displays the items the client currently holds

  itemsDialog.dialogText = this.add
    .text(600, 500, 'User Items: ', {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0)
    .setDepth(30);

  // Debug graphics
  this.input.keyboard.once("keydown_D", event => {
    // Turn on physics debugging to show player's hitbox
    this.physics.world.createDebugGraphic();

    // Create worldLayer collision graphic above the player, but below the help text
    const graphics = this.add
      .graphics()
      .setAlpha(0.75)
      .setDepth(20);
    worldLayer.renderDebug(graphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    });
  });

  this.input.keyboard.on('keydown_T', (event) => {
    if ((Math.round(players[socket.id].player.x) - 976) >= -10 && (Math.round(players[socket.id].player.x) - 976) <= 10 && (Math.round(players[socket.id].player.y) - 840) >= -10 && (Math.round(players[socket.id].player.y) - 840) <= 10) {
      console.log('Talk to that fountain!');
      messageDialog.setDialogText(this, fountainText);
    }
  });

  socket.on('players', (currPlayers) => {
    for (var id in currPlayers) {
      players[id] = {
        player: this.physics.add
          .sprite(currPlayers[id].x, currPlayers[id].y, "atlas", "misa-front")
          .setSize(30, 40)
          .setOffset(0, 24),
      };

      if (socket.id === id) {
        camera.startFollow(players[socket.id].player);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      }

      this.physics.add.collider(players[id].player, worldLayer);
    }
  });

  socket.on('player connected', (id, x, y) => {
    if (id !== socket.id) { // player connected is not themself
      players[id] = {
        player: this.physics.add
          .sprite(x, y, "atlas", "misa-front")
          .setSize(30, 40)
          .setOffset(0, 24),
      };

      this.physics.add.collider(players[id].player, worldLayer);
      console.log(players[id]);
    }
  });

  socket.on('player disconnected', (id) => {
    players[id].player.destroy();
    delete players[id];
  });

  socket.emit('request players');

  // fetches client's initial items
  const url = 'http://localhost:5000/items';
  fetch(url).then((data) => {
    return data.json();
  }).then((res) => {
    let items = Object.entries(res);
    let text = 'User Items: ';

    for (const [key, value] of items) {
      text += `\n${key}`;
    }
    itemsDialog.updateDialogText(text);
  });
}

function update(time, delta) {
  const speed = 175;

  if (messageDialog.dialogText !== undefined) {
    if (messageDialog.dialogPersistence === 200) {
      messageDialog.removeDialog();
    }
    else {
      messageDialog.dialogPersistence++;
    }
  }

  socket.on('game state', (updatedPlayers) => {
    for (var id in updatedPlayers) {
      if (players[id] !== undefined) { // emitted player is registered to client
        // Stop any previous movement from the last frame
        players[id].player.body.setVelocity(0);

        players[id].player.body.setVelocityX(updatedPlayers[id].velocityX);
        players[id].player.body.setVelocityY(updatedPlayers[id].velocityY);
        players[id].player.body.velocity.normalize().scale(175);

        if (updatedPlayers[id].movement === 'left') {
          players[id].player.anims.play('misa-left-walk', true);
        }
        else if (updatedPlayers[id].movement === 'right') {
          players[id].player.anims.play('misa-right-walk', true);
        }
        else if (updatedPlayers[id].movement === 'up') {
          players[id].player.anims.play('misa-back-walk', true);
        }
        else if (updatedPlayers[id].movement === 'down') {
          players[id].player.anims.play('misa-front-walk', true);
        }
        else {
          players[id].player.anims.stop();
          players[id].player.body.setVelocity(0);

          if (updatedPlayers[id].prevVelocityX < 0) players[id].player.setTexture("atlas", "misa-left");
          else if (updatedPlayers[id].prevVelocityX > 0) players[id].player.setTexture("atlas", "misa-right");
          else if (updatedPlayers[id].prevVelocityY < 0) players[id].player.setTexture("atlas", "misa-back");
          else if (updatedPlayers[id].prevVelocityY > 0) players[id].player.setTexture("atlas", "misa-front");
        }

        if (id !== socket.id) {
          players[id].player.x = updatedPlayers[id].x;
          players[id].player.y = updatedPlayers[id].y;
        }
      }
    }
  });

  if (players[socket.id] !== undefined && cursors) { // client data is ready to send
    socket.emit('player state', players[socket.id].player.x, players[socket.id].player.y, cursors, players[socket.id].player.body.velocity.clone());
  }
}
