document.addEventListener("DOMContentLoaded", () => {
  // ===================
  // Variabel DOM & Audio
  // ===================
  let canvas = document.querySelector("canvas");
  let ctx = canvas.getContext("2d");
  let startButton = document.getElementById("startButton");
  let startScreen = document.getElementById("startScreen");
  let creditButton = document.getElementById("creditButton");
  let creditScreen = document.getElementById("creditScreen");
  let gameOverScreen = document.getElementById("gameOverScreen");
  let backHome = document.getElementById("backHome"); // Tombol di creditScreen
  let backHomeOver = document.getElementById("backHomeOver"); // Tombol di gameOverScreen
  let highScoreButton = document.getElementById("highScoreButton");
  let highScoreScreen = document.getElementById("highScoreScreen");
  let backHighScore = document.getElementById("backHighScore");
  let playerNameInput = document.querySelector("#playerName");
  let scor = document.getElementById("scor");
  let Game = document.getElementById("Game");
  let shootSound = new Audio("./audio/gun.mp3");
  let laserSound = new Audio("./audio/laser.mp3");
  let oughpSound = new Audio("./audio/oughp.mp3");
  let ougheSound = new Audio("./audio/oughe.mp3");

  // ===================
  // Variabel Global Kontrol
  // ===================
  let enemyInterval, animationId, timerId;
  let isGameOver = false;
  let gameStarted = false; // Hanya aktif saat game berjalan
  let playerScore = 0;
  let timer = 60;

  // Variabel global untuk menyimpan nama pemain (akan di-set saat Start)
  window.playerName = "player";

  // Variabel input untuk pergerakan
  let keys = {
    a: { pressed: false },
    d: { pressed: false },
  };

  canvas.width = 1024;
  canvas.height = 768;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gravity = 0.7;

  // ===================
  // Inisialisasi sessionStorage untuk high scores (sebagai database JSON sementara)
  // ===================
  if (!sessionStorage.getItem("highScores")) {
    sessionStorage.setItem("highScores", JSON.stringify([]));
  }

  // ===================
  // Event Listener untuk Credit & High Score Screen
  // ===================
  creditButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    creditScreen.style.display = "flex";
  });
  highScoreButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    highScoreScreen.style.display = "flex";
    displayHighScores();
  });
  backHome.addEventListener("click", () => {
    creditScreen.style.display = "none";
    startScreen.style.display = "flex";
  });
  backHighScore.addEventListener("click", () => {
    highScoreScreen.style.display = "none";
    startScreen.style.display = "flex";
  });

  // ===================
  // Kelas-Kelas
  // ===================
  class Sprite {
    constructor({
      position,
      imageSrc,
      scale = 1,
      framesMax = 1,
      offset = { x: 0, y: 0 },
    }) {
      this.position = position;
      this.width = 50;
      this.height = 150;
      this.image = new Image();
      this.image.src = imageSrc;
      this.scale = scale;
      this.framesMax = framesMax;
      this.framesCurrent = 0;
      this.framesElapsed = 0;
      this.framesHold = 5;
      this.offset = offset;
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.framesCurrent * (this.image.width / this.framesMax),
        0,
        this.image.width / this.framesMax,
        this.image.height,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        (this.image.width / this.framesMax) * this.scale,
        this.image.height * this.scale
      );
    }
    animateFrames() {
      this.framesElapsed++;
      if (this.framesElapsed % this.framesHold === 0) {
        this.framesCurrent =
          this.framesCurrent < this.framesMax - 1 ? this.framesCurrent + 1 : 0;
      }
    }
    update() {
      this.draw();
      this.animateFrames();
    }
  }

  class Fighter extends Sprite {
    constructor({ position, velocity, color = "red", sprites, isAI = false }) {
      super({
        position,
        imageSrc: null,
        scale: 1,
        framesMax: 1,
        offset: { x: 0, y: 0 },
      });
      this.velocity = velocity;
      this.width = 50;
      this.height = 150;
      this.lastKey = "";
      this.color = color;
      this.health = 100;
      this.dead = false;
      this.jumpCount = 0;
      this.isAI = isAI;
      this.canShoot = true;
      this.name = "player";
      this.isShieldActive = false; // Properti shield, default false
    }
    // Gambar player sebagai segitiga (hanya untuk player biru)
    draw() {
      if (this.color === "blue") {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-25, 50);
        ctx.lineTo(25, 50);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Gambar nama pemain di atas segitiga tanpa rotasi
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "16px Press Start 2P";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.position.x - 40, this.position.y - 50);
        ctx.restore();
        // Jika shield aktif, gambar shield
        if (this.isShieldActive) {
          ctx.strokeStyle = "cyan";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(
            this.position.x - 30,
            this.position.y - 5,
            35,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      }
    }
    update() {
      this.draw();
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      if (this.position.x < 30) this.position.x = 30;
      if (this.position.x > 999) this.position.x = 999;
      if (this.position.y < 0) this.position.y = 0;
      if (this.position.y > canvas.height - this.height)
        this.position.y = canvas.height - this.height;
      if (
        this.position.y + this.height + this.velocity.y >=
        canvas.height - 30
      ) {
        this.velocity.y = 0;
        this.position.y = canvas.height - this.height - 30;
        this.jumpCount = 0;
      } else {
        this.velocity.y += gravity;
      }
    }
    switchSprite(sprite) {
      // Implementasi switch sprite (jika ada asset animasi)
    }
  }

  class EnemyFighter extends Fighter {
    constructor(options) {
      super(options);
      this.size = 35;
      this.speedY = 7;
    }
    draw() {
      ctx.fillStyle = "purple";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        let angle = (i * 2 * Math.PI) / 5;
        let x = this.position.x + this.size * Math.cos(angle);
        let y = this.position.y + this.size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    update() {
      this.position.y += this.speedY;
      if (
        this.position.y - this.size <= 0 ||
        this.position.y + this.size >= canvas.height - 100
      ) {
        this.speedY *= -1;
      }
      this.draw();
    }
    shootAutomatically() {
      bullets.push(
        new Bullet({
          position: { x: this.position.x, y: this.position.y + 25 },
          velocity: { x: -5, y: 0 },
          color: "red",
          owner: "enemy",
        })
      );
    }
    switchSprite(sprite) {}
  }

  class Bullet {
    constructor({ position, velocity, color = "red", owner }) {
      this.radius = 10;
      this.position = position;
      this.velocity = velocity;
      this.width = this.radius * 2;
      this.height = this.radius * 2;
      this.color = color;
      this.owner = owner;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.radius,
        this.position.y + this.radius,
        this.radius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }
    update() {
      this.draw();
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
    }
  }

  // ===================
  // Array untuk peluru
  // ===================
  let bullets = [];

  // ===================
  // Fungsi Collision Detection
  // ===================
  function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
      rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
      rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
      rectangle1.position.y + rectangle1.height >= rectangle2.position.y &&
      rectangle1.position.y <= rectangle2.position.y + rectangle2.height
    );
  }

  // ===================
  // Shield Pickup Object
  // ===================
  let shieldPickup = {
    position: { x: canvas.width / 2 - 25, y: canvas.height / 2 - 25 }, // contoh di tengah
    width: 50,
    height: 50,
    active: true,
  };

  // Gambar objek shield pickup
  function drawShieldPickup() {
    if (!shieldPickup.active) return;
    ctx.save();
    ctx.fillStyle = "cyan";
    ctx.fillRect(
      shieldPickup.position.x,
      shieldPickup.position.y,
      shieldPickup.width,
      shieldPickup.height
    );
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      shieldPickup.position.x,
      shieldPickup.position.y,
      shieldPickup.width,
      shieldPickup.height
    );
    ctx.restore();
  }

  // Collision detection untuk shield pickup (bounding box sederhana)
  function collisionWithShield(player, shield) {
    return (
      player.position.x < shield.position.x + shield.width &&
      player.position.x + player.width > shield.position.x &&
      player.position.y < shield.position.y + shield.height &&
      player.position.y + player.height > shield.position.y
    );
  }

  // ===================
  // Timer Countdown
  // ===================
  function decreaseTimer() {
    if (timer > 0) {
      timerId = setTimeout(decreaseTimer, 1000);
      timer--;
      document.querySelector("#timer").innerHTML = timer;
    }
    if (timer === 0) {
      determineWinner({ timerId });
      scorGameWin();
    }
  }

  // ===================
  // Mulai Game
  // ===================
  function startGame() {
    if (enemyInterval) clearInterval(enemyInterval);
    if (animationId) cancelAnimationFrame(animationId);
    clearTimeout(timerId);

    isGameOver = false;
    gameStarted = true;
    playerScore = 0;
    timer = 60;
    bullets = [];

    Game.style.display = "inline-block";
    startScreen.style.display = "none";

    let background = new Sprite({
      position: { x: 0, y: 0 },
      imageSrc: "./img/background.png",
    });
    let shop = new Sprite({
      position: { x: 705, y: 300 },
      imageSrc: "./img/shop.png",
      scale: 2.75,
      framesMax: 6,
    });

    window.player = new Fighter({
      position: { x: 30, y: 0 },
      velocity: { x: 0, y: 0 },
      color: "blue",
      sprites: {},
    });
    player.canShoot = true;
    window.player.name = window.playerName;
    document.querySelector(
      "#playerScore"
    ).parentElement.innerHTML = `${window.playerName} Score: <span id="playerScore">0</span>`;

    let enemy = new EnemyFighter({
      position: { x: canvas.width - 100, y: canvas.height / 2 },
      velocity: { x: 0, y: 0 },
      color: "purple",
      isAI: true,
    });

    decreaseTimer();

    function animate() {
      animationId = window.requestAnimationFrame(animate);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      background.update();
      shop.update();
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      player.update();
      enemy.update();

      // Gambar objek shield pickup dan cek collision dengan player
      drawShieldPickup();
      if (shieldPickup.active && collisionWithShield(player, shieldPickup)) {
        shieldPickup.active = false; // Sembunyikan objek pickup
        player.isShieldActive = true;

        // Setelah 5 detik, hapus efek shield dan respawn pickup di posisi acak
        setTimeout(() => {
          player.isShieldActive = false;
          shieldPickup.position.x =
            Math.random() * (canvas.width - shieldPickup.width);
          shieldPickup.position.y =
            Math.random() * (canvas.height - shieldPickup.height - 100) + 50;
          shieldPickup.active = true;
        }, 5000);
      }

      if (keys.a.pressed) {
        player.velocity.x = -5;
        player.lastKey = "a";
        player.switchSprite("run");
      } else if (keys.d.pressed) {
        player.velocity.x = 5;
        player.lastKey = "d";
        player.switchSprite("run");
      } else {
        player.velocity.x = 0;
        player.switchSprite("idle");
      }
      if (player.velocity.y < 0) {
        player.switchSprite("jump");
      } else if (player.velocity.y > 0) {
        player.switchSprite("fall");
      }

      bullets.forEach((bullet, index) => {
        if (isGameOver) return;
        bullet.update();
        if (bullet.position.x > canvas.width || bullet.position.x < 0) {
          bullets.splice(index, 1);
        }
        if (
          bullet.owner === "player" &&
          rectangularCollision({ rectangle1: bullet, rectangle2: enemy })
        ) {
          bullets.splice(index, 1);
          playerScore++;
          document.querySelector("#playerScore").innerText = playerScore;
          oughpSound.currentTime = 0;
          oughpSound.play();
        } else if (
          bullet.owner === "enemy" &&
          rectangularCollision({ rectangle1: bullet, rectangle2: player })
        ) {
          bullets.splice(index, 1);
          if (!player.isShieldActive) {
            determineWinner({ timerId });
            scorGameOver();
            ougheSound.currentTime = 0;
            ougheSound.play();
          }
        }
      });

      if (timer <= 0) {
        determineWinner({ timerId });
        player.position.x = 30;
        enemy.position.x = 999;
      }
    }
    animate();

    enemyInterval = setInterval(() => {
      if (!isGameOver) {
        enemy.shootAutomatically();
        shootSound.currentTime = 0;
        shootSound.play();
      }
    }, 2000);
  }

  // ===================
  // Event Listener Global untuk Input
  // ===================
  window.addEventListener("keydown", (event) => {
    if (!gameStarted) return;
    if (!player.dead) {
      if (event.key === "d") {
        keys.d.pressed = true;
        player.lastKey = "d";
      } else if (event.key === "a") {
        keys.a.pressed = true;
        player.lastKey = "a";
      } else if (event.key === "w") {
        if (player.jumpCount < 2) {
          player.velocity.y = -20;
          player.jumpCount++;
        }
      } else if (event.key === " ") {
        if (player.canShoot) {
          bullets.push(
            new Bullet({
              position: {
                x: player.position.x + 50,
                y: player.position.y + 30,
              },
              velocity: { x: 10, y: 0 },
              owner: "player",
            })
          );
          player.switchSprite("shoot");
          laserSound.currentTime = 0;
          laserSound.play();
          player.canShoot = false;
          setTimeout(() => {
            player.canShoot = true;
          }, 800);
        }
      }
      // Jika sebelumnya menggunakan tombol "q" untuk shield, kita nonaktifkan event tersebut.
    }
  });
  window.addEventListener("keyup", (event) => {
    if (!gameStarted) return;
    if (event.key === "d") {
      keys.d.pressed = false;
    } else if (event.key === "a") {
      keys.a.pressed = false;
    }
  });

  // ===================
  // Determine Winner & Restart
  // ===================
  function determineWinner({ timerId }) {
    clearTimeout(timerId);
    gameOverScreen.style.display = "flex";

    let storedHighScores =
      JSON.parse(sessionStorage.getItem("highScores")) || [];
    let existingRecord = storedHighScores.find(
      (record) => record.name === player.name
    );
    if (existingRecord) {
      if (playerScore > existingRecord.score) {
        existingRecord.score = playerScore;
      }
    } else {
      storedHighScores.push({ name: player.name, score: playerScore });
    }
    storedHighScores.sort((a, b) => b.score - a.score);
    storedHighScores = storedHighScores.slice(0, 10);
    sessionStorage.setItem("highScores", JSON.stringify(storedHighScores));

    displayHighScores();
    gameOverScreen.style.display = "flex";

    backHomeOver.addEventListener("click", restartGame);
    isGameOver = true;
    gameStarted = false;
    if (enemyInterval) clearInterval(enemyInterval);
    cancelAnimationFrame(animationId);
  }

  function scorGameOver() {
    scor.innerHTML = `<h1>GAME OVER</h1> <br> <marquee scrollamount="15">${player.name} Score: ${playerScore} </marquee>`;
  }

  function scorGameWin() {
    scor.innerHTML = `<h1>Berhasil Selamat</h1> <br> <marquee scrollamount="15">${player.name} Score: ${playerScore} </marquee>`;
  }

  function displayHighScores() {
    let storedHighScores =
      JSON.parse(sessionStorage.getItem("highScores")) || [];
    let highScoreList = document.getElementById("highScoreList");
    if (highScoreList) {
      highScoreList.innerHTML = storedHighScores
        .map((score) => `<li>${score.name}: ${score.score}</li>`)
        .join("");
    }
  }

  function restartGame() {
    if (enemyInterval) clearInterval(enemyInterval);
    cancelAnimationFrame(animationId);
    clearTimeout(timerId);
    gameOverScreen.style.display = "none";
    Game.style.display = "none";
    startScreen.style.display = "flex";

    playerScore = 0;
    timer = 60;
    isGameOver = false;
    gameStarted = false;
    bullets = [];

    document.querySelector("#playerScore").innerText = playerScore;
    scor.innerHTML = "";
    keys.a.pressed = false;
    keys.d.pressed = false;
    if (window.player) {
      window.player.lastKey = "";
    }
  }

  // ===================
  // Mulai Game
  // ===================
  startButton.addEventListener("click", () => {
    let playerNameInput = document.querySelector("#playerName");
    let inputName = playerNameInput ? playerNameInput.value.trim() : "";
    if (inputName === "") {
      alert("Masukkan nama Anda untuk memulai game!");
      return;
    }
    window.playerName = inputName.toLowerCase();
    startGame();
    gameStarted = true;
  });
});
