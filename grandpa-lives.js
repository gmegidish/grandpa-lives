window.requestAnimFrame = (function () {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (callback, element) {
				window.setTimeout(callback, 1000 / 60);
			};
	}
)();

var ZombieNode = function () {
	var d = document.createElement("div");
	d.setAttribute("class", "sprite sprite-zombie_left_0-png");
	d.style.position = "absolute";
	d.style.top = "" + (Math.random() * 720) + "px";
	d.style.left = "" + (Math.random() * 1280) + "px";
	d.style.zIndex = parseInt(d.style.top) + 67;

	this.randomizeDest = function () {
		this.speedX = (3 + Math.random() * 4) * 0.125;
		this.speedY = (3 + Math.random() * 4) * 0.125;

		this.destX = Math.random() * 1280;
		this.destY = Math.random() * 720;

		this.dir = (this.destX >= this.x) ? "right" : "left";
	};

	this.div = d;

	this.x = parseFloat(d.style.left);
	this.y = parseFloat(d.style.top);

	this.frame = Math.random() * 12;
	this.mode = 0;

	this.randomizeDest();
};

var GirlNode = function () {
	var d = document.createElement("div");

	d.setAttribute("class", "sprite sprite-player_left_0-png");
	d.style.position = "absolute";
	d.style.top = "" + ((720 - 42) / 2) + "px";
	d.style.left = "" + ((1280 - 43) / 2) + "px";
	d.style.zIndex = parseInt(d.style.top) + 42;

	this.div = d;
	this.x = parseFloat(d.style.left);
	this.y = parseFloat(d.style.top);
	this.frame = 0;
	this.direction = 0;
};

var GrandpaGame = function () {

	this.KEY_LEFT = 1;
	this.KEY_RIGHT = 2;
	this.KEY_UP = 4;
	this.KEY_DOWN = 8;
	this.KEY_ACTION = 16;

	this.ZOMBIE_COUNT = 350;
	this.ZOMBIE_SPR_HEIGHT = 67;

	this.TIME_TILL_MASS_MURDER = 250 / 15;

	this.GAME_STATE_MENU = 0;
	this.GAME_STATE_PLAYING = 1;
	this.GAME_STATE_HEARTATTACK = 2;
	this.GAME_STATE_HIT = 3;
	this.GAME_STATE_MISS = 4;

	this.ZOMBIE_MODE_NORMAL = 0;
	this.ZOMBIE_MODE_ATTACK = 1;
	this.ZOMBIE_MODE_HAPPY = 2;

	this.DISTANCE_TO_SUCCEED = 80.0;

	this.TIME_BETWEEN_HEARTBEATS = 1000;

	this.zombies = [];

	this.cheatMode = false;

	this.lastStatisticsTimestamp = 0;
	this.framesDrawn = 0;

	this.paused = false;

	this.menuFields = {
		currentOption: 0,
		startTime: 0,
		waitingForKeyRelease: false
	};

	this.hitMissFields = {
		startTime: 0
	};

	this.heartattackFields = {
		start: 0
	};

	this.keys = 0;
	this.gameTime = 0;
	this.gameState = this.GAME_STATE_MENU;

	this.gameCanvas = document.getElementById("canvas");

	this.lastHeartbeat = 0;

	this.initialize = function () {
		document.addEventListener("keyup", $.proxy(this.onKeyUp, this), false);
		document.addEventListener("keydown", $.proxy(this.onKeyDown, this), false);

		this.initMenu();
	}

	this.initMenu = function () {
		this.gameState = this.GAME_STATE_MENU;

		this.menuFields.startTime = this.gameTime;
		this.menuFields.currentOption = 0;
		this.menuFields.waitingForKeyRelease = false;

		// delete all other elements
		this.gameCanvas.innerHTML = "";

		var back = $("<div></div>");
		back.css("width", "100%");
		back.css("height", "100%");
		back.css("position", "absolute");
		back.css("top", 0);
		back.css("left", 0);
		back.css("backgroundColor", "#000");
		$(this.gameCanvas).append(back);

		var c = document.createElement("div");
		c.setAttribute("class", "sprite sprite-cursor-png");
		c.style.position = "absolute";
		c.style.top = 314;
		c.style.left = 126;
		c.style.width = 11;
		c.style.height = 16;
		c.style.zIndex = 1;
		this.gameCanvas.appendChild(c);

		var logo = $("<div></div>");
		logo.attr("class", "sprite sprite-logo-300-png");
		logo.css("position", "absolute");
		logo.css("top", 50);
		logo.css("left", 64);
		logo.css("zIndex", 1);
		$(this.gameCanvas).append(logo);

		var start = $("<div></div>");
		start.attr("class", "sprite sprite-start-png");
		start.css("position", "absolute");
		start.css("top", 316);
		start.css("left", 152);
		start.css("zIndex", 1);
		start.css("cursor", "pointer");
		$(this.gameCanvas).append(start);

		var cheat = $("<div></div>").attr("class", "sprite sprite-cheat-png").css({
			position: "absolute",
			top: "349px",
			left: "152px",
			zIndex: 1,
			cursor: "pointer"
		});
		$(this.gameCanvas).append(cheat);

		var right = document.createElement("div");
		right.setAttribute("class", "sprite sprite-menu-right-zombie-png");
		right.style.position = "absolute";
		right.style.top = "122px";
		right.style.left = "-380px";
		right.style.transform = "scale(1.5)";
		right.style.zIndex = 1;
		this.gameCanvas.appendChild(right);

		var overlay = $("<div></div>");
		overlay.attr("class", "white-overlay");
		overlay.css("width", "100%");
		overlay.css("height", "100%");
		overlay.css("position", "absolute");
		overlay.css("top", 0);
		overlay.css("left", 0);
		overlay.css("zIndex", 100);
		overlay.css("opacity", 0);
		overlay.css("backgroundColor", "#fff");
		$(this.gameCanvas).append(overlay);

		var that = this;

		$(right).animate({
			left: "800px",
		}, 200, "swing", function () {
			// when animation is done
			that.fadeOutMenuOverlay();
		});

		$(start).click(function () {
			that.cheatMode = false;
			that.initGame();
		});

		$(cheat).click(function () {
			that.cheatMode = true;
			that.initGame();
		});

		$("#audio-title")[0].loop = true;
		$("#audio-title")[0].currentTime = 0;
		$("#audio-title")[0].play();
	};

	this.fadeOutMenuOverlay = function () {
		var overlay = $(".white-overlay");
		overlay.css("opacity", 100);
		overlay.animate({
			opacity: 0
		}, 500, "swing", function () {
			overlay.remove();
		});
	};

	this.initGame = function () {

		$("#audio-title")[0].pause();
		$("#audio-game-start")[0].play();

		this.gameState = this.GAME_STATE_PLAYING;
		this.gameCanvas.innerHTML = "";

		// create 300 zombies
		this.zombies = [];
		for (var i = 0; i < this.ZOMBIE_COUNT; i++) {
			var zombie = new ZombieNode();
			this.zombies.push(zombie);
			this.gameCanvas.appendChild(zombie.div);
		}

		// create little girl
		this.girl = new GirlNode();
		this.gameCanvas.appendChild(this.girl.div);

		// create background texture
		var t = document.createElement("div");
		t.style.width = "100%"
		t.style.height = "100%";
		t.style.position = "absolute";
		t.style.backgroundImage = "url(gfx/texture-bg.png)";
		t.style.top = 0;
		t.style.left = 0;
		t.style.zIndex = 0;
		this.gameCanvas.appendChild(t);

		var border = $("<div></div>").attr("class", "border").css({
			width: "100%",
			height: "100%",
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			zIndex: 10000,
			boxSizing: "border-box"
		});

		$(this.gameCanvas).append(border);
	};

	this.distanceToGrandpa = function () {
		var dx = (this.girl.x + 43 / 2) - (this.zombies[0].x + 39 / 2);
		var dy = (this.girl.y + 42) - (this.zombies[0].y + 67);
		var distance = Math.sqrt(dx * dx + dy * dy);

		return distance;
	};

	this.processInput = function () {

		var frameChanged = false;

		if (this.keys & this.KEY_LEFT) {
			if (this.girl.x > 0) {
				this.girl.x -= 3;
				this.girl.div.style.left = this.girl.x;
				this.girl.direction = "left";

				frameChanged = true;
			}
		} else if (this.keys & this.KEY_RIGHT) {
			if (this.girl.x < 1280 - 43) {
				this.girl.x += 3;
				this.girl.div.style.left = this.girl.x;
				this.girl.direction = "right";
				frameChanged = true;
			}
		}

		if (this.keys & this.KEY_UP) {
			if (this.girl.y > 0) {
				this.girl.y -= 3;
				this.girl.div.style.top = this.girl.y;
				this.girl.div.style.zIndex = parseInt(this.girl.y) + 42;

				frameChanged = true;
			}
		} else if (this.keys & this.KEY_DOWN) {
			if (this.girl.y < 720 - 42) {
				this.girl.y += 3;
				this.girl.div.style.top = this.girl.y;
				this.girl.div.style.zIndex = parseInt(this.girl.y) + 42;
				frameChanged = true;
			}
		}

		if (frameChanged) {
			this.girl.frame++;
			this.girl.frame %= 3;
			this.girl.div.setAttribute("class", "sprite sprite-player_" + this.girl.direction + "_" + this.girl.frame + "-png");
		}

		if (this.keys & this.KEY_ACTION) {
			this.initHeartattack();
		}
	};

	this.initHeartattack = function () {
		this.gameState = this.GAME_STATE_HEARTATTACK;
		this.heartattackFields.start = +new Date();

		$(".border").hide();
		$("#audio-heartbeat")[0].pause();
	};

	this.initHit = function () {

		this.gameState = this.GAME_STATE_HIT;
		this.hitMissFields.startTime = this.gameTime;

		// process grandpa
		this.zombies[0].destX = parseInt(this.gameCanvas.style.width);
		this.zombies[0].destY = this.zombies[0].y;
		this.zombies[0].speedX = 1.5;
		this.zombies[0].speedY = 0.0;
		this.zombies[0].mode = this.ZOMBIE_MODE_HAPPY;

		for (var i = 1; i < this.zombies.length; i++) {
			this.zombies[i].frame = Math.floor(Math.random() * 12);
			this.zombies[i].speedX = 0.15;
			this.zombies[i].speedY = 0.15;
		}

		// init flashing banner
		var div = document.createElement("div");
		div.setAttribute("class", "sprite sprite-lives-png");
		div.style.position = "absolute";
		div.style.top = (parseInt(this.gameCanvas.style.height) - 28 - 20);
		div.style.left = (parseInt(this.gameCanvas.style.width) - 422) / 2;
		div.style.zIndex = 50000;
		this.gameCanvas.appendChild(div);

		this.flashingText = div;

		$("#audio-hit")[0].play();
	};

	this.initMiss = function () {
		this.gameState = this.GAME_STATE_MISS;
		this.hitMissFields.startTime = this.gameTime;

		var MASS_MURDER_RADIUS = 96;

		// Mix_PlayChannel(-1, missSfx, 0);
		for (var i = 1; i < this.zombies.length; i++) {
			var t = 2 * Math.PI * Math.random();
			var u = Math.random() + Math.random();
			var r = (u > 1) ? (2 - u) : u;

			var x = MASS_MURDER_RADIUS * r * Math.cos(t);
			var y = MASS_MURDER_RADIUS * r * Math.sin(t);

			this.zombies[i].destX = this.girl.x + x;
			this.zombies[i].destY = this.girl.y + y;
			this.zombies[i].speedX = Math.abs(this.zombies[i].destX - this.zombies[i].x) / this.TIME_TILL_MASS_MURDER;
			this.zombies[i].speedY = Math.abs(this.zombies[i].destY - this.zombies[i].y) / this.TIME_TILL_MASS_MURDER;
			this.zombies[i].frame = Math.floor(Math.random() * 12);
			this.zombies[i].mode = this.ZOMBIE_MODE_ATTACK;
		}

		// process grandpa
		if (Math.abs(this.girl.y - this.zombies[0].y) > MASS_MURDER_RADIUS) {
			// far away from crowd
			this.zombies[0].destY = this.zombies[0].y;
			if (this.zombies[0].x < (760 / 2)) {
				this.zombies[0].destX = 760;
			} else {
				this.zombies[0].destX = -70;
			}
		} else {
			// too close to crowd
			this.zombies[0].destX = this.zombies[0].x;
			if (this.zombies[0].y < (475 / 2)) {
				this.zombies[0].destY = 475;
			} else {
				this.zombies[0].destY = -70;
			}
		}

		this.zombies[0].speedX = 1.5;
		this.zombies[0].speedY = 1.5;
		this.zombies[0].mode = this.ZOMBIE_MODE_HAPPY;

		// init flashing banner
		var div = document.createElement("div");
		div.setAttribute("class", "sprite sprite-leaves-png");
		div.style.position = "absolute";
		div.style.top = (parseInt(this.gameCanvas.style.height) - 28 - 20);
		div.style.left = (parseInt(this.gameCanvas.style.width) - 462) / 2;
		div.style.zIndex = 50000;
		this.gameCanvas.appendChild(div);

		this.flashingText = div;

		var splash = $("<div></div>");
		splash.attr("class", "splash-sprite sprite-splash_0_0-png splash");
		splash.css("position", "absolute");
		splash.css("left", parseInt(this.girl.x) + 43 / 2 - 286 / 2);
		splash.css("top", parseInt(this.girl.y) + 42 / 2 - 283);
		splash.css("zIndex", 40000);
		splash.css("display", "none");
		$(this.gameCanvas).append(splash);

		this.hitMissFields.splashAnim = Math.floor(Math.random() * 3);
		this.hitMissFields.splashFrame = 0;

		$("#audio-miss")[0].play();
	};

	this.heartattackTick = function () {
		var diff = this.gameTime - this.heartattackFields.start;
		if (diff > 2000) {

			if (this.distanceToGrandpa() < this.DISTANCE_TO_SUCCEED) {
				this.initHit();
			} else {
				this.initMiss();
			}
		}
	};

	this.onKeyDown = function (e) {
		switch (e.keyCode) {
			case 13:
			case 32:
				this.keys |= this.KEY_ACTION;
				e.preventDefault();
				break;

			case 37:
				this.keys |= this.KEY_LEFT;
				e.preventDefault();
				break;

			case 38:
				this.keys |= this.KEY_UP;
				e.preventDefault();
				break;

			case 39:
				this.keys |= this.KEY_RIGHT;
				e.preventDefault();
				break;

			case 40:
				this.keys |= this.KEY_DOWN;
				e.preventDefault();
				break;

			case 80:
				this.paused ^= 1;
				e.preventDefault();
				break;
		}

	};

	this.onKeyUp = function (e) {
		switch (e.keyCode) {
			case 13:
			case 32:
				this.keys &= ~this.KEY_ACTION;
				e.preventDefault();
				break;

			case 37:
				this.keys &= ~this.KEY_LEFT;
				e.preventDefault();
				break;

			case 38:
				this.keys &= ~this.KEY_UP;
				e.preventDefault();
				break;

			case 39:
				this.keys &= ~this.KEY_RIGHT;
				e.preventDefault();
				break;

			case 40:
				this.keys &= ~this.KEY_DOWN;
				e.preventDefault();
				break;
		}
	};

	this.singleZombieStep = function () {
		for (var i = 0; i < this.zombies.length; i++) {

			var x = this.zombies[i].x;
			var y = this.zombies[i].y;
			var dx = this.zombies[i].destX;
			var dy = this.zombies[i].destY;
			var sx = this.zombies[i].speedX;
			var sy = this.zombies[i].speedY;

			var dir = this.zombies[i].dir;

			if (x < dx) {
				// going right
				dir = "right";
				x = Math.min(x + sx, dx);
			} else if (x > dx) {
				dir = "left";
				x = Math.max(x - sx, dx);
			}

			if (y < dy) {
				// going down
				y = Math.min(y + sy, dy);
			} else if (y > dy) {
				y = Math.max(y - sy, dy);
			}

			this.zombies[i].x = x;
			this.zombies[i].y = y;
			this.zombies[i].dir = dir;
			this.zombies[i].div.style.top = y;
			this.zombies[i].div.style.left = x;
			this.zombies[i].div.style.zIndex = parseInt(this.zombies[i].y) + this.ZOMBIE_SPR_HEIGHT;

			this.zombies[i].frame++;
			this.zombies[i].frame %= 24;

			var f = [0, 1, 0, 2][Math.floor(this.zombies[i].frame / 6)];
			var mode;
			switch (this.zombies[i].mode) {
				case this.ZOMBIE_MODE_NORMAL:
					mode = "zombie";
					break;

				case this.ZOMBIE_MODE_ATTACK:
					mode = "attack";
					break;

				case this.ZOMBIE_MODE_HAPPY:
					mode = "happy";
					break;
			}

			this.zombies[i].div.setAttribute("class", "sprite sprite-" + mode + "_" + dir + "_" + f + "-png");

			if (x == dx && y == dy) {
				if (this.gameState == this.GAME_STATE_PLAYING) {
					this.zombies[i].randomizeDest();
				}
			}
		}

		if (this.cheatMode) {
			// flash grandpa
			var o = Math.abs(Math.sin(this.gameTime / 1000 / 30 / Math.PI * 180.0));
			this.zombies[0].div.style.opacity = "" + o;
			this.zombies[0].div.style.transform = "scale(2)";
		}

		if (this.gameState === this.GAME_STATE_HIT || this.gameState === this.GAME_STATE_MISS) {
			var diff = this.gameTime - this.hitMissFields.startTime;
			var flipflop = Math.floor(diff / 250) % 2;
			this.flashingText.style.opacity = (1 - flipflop);
		}

		if (this.gameState === this.GAME_STATE_HIT) {
			this.girl.x += 1.5;
			this.girl.div.style.left = this.girl.x;
			this.girl.direction = "right";
			this.girl.frame++;
			this.girl.frame %= 3;
			this.girl.div.setAttribute("class", "sprite sprite-player_" + this.girl.direction + "_" + this.girl.frame + "-png");
		}

		if (this.gameState === this.GAME_STATE_MISS) {

			var diff = this.gameTime - this.hitMissFields.startTime;
			if (diff >= this.TIME_TILL_MASS_MURDER) {
				// only after crowd cought the girl

				//if ((diff % 3) == 0) {
				{
					this.hitMissFields.splashFrame++;
					if (this.hitMissFields.splashFrame == 4) {
						this.hitMissFields.splashFrame = 0;
						this.hitMissFields.splashAnim = Math.floor(Math.random() * 3);
					}
				}

				var name = "sprite-splash_" + this.hitMissFields.splashAnim + "_" + this.hitMissFields.splashFrame + "-png";
				$(".splash").attr("class", "splash splash-sprite " + name);
				$(".splash").css("display", "block");
			}
		}
	};

	this.menuGameTick = function () {

		if (this.menuFields.waitingForKeyRelease === false) {
			if (this.keys & (this.KEY_UP | this.KEY_DOWN)) {
				this.menuFields.waitingForKeyRelease = true;
				this.menuFields.currentOption ^= 1;

				var c = $(".sprite-cursor-png");
				var y = 314 + ((this.menuFields.currentOption === 0) ? 0 : 33);
				c.css("top", y);
			}

			if (this.keys & this.KEY_ACTION) {
				this.keys = 0;
				this.cheatMode = (this.menuFields.currentOption === 1);
				this.initGame();
			}
		} else {
			if ((this.keys & (this.KEY_UP | this.KEY_DOWN)) === 0) {
				this.menuFields.waitingForKeyRelease = false;
			}
		}
	};

	this.updateSound = function () {

		if ((this.gameTime - this.lastHeartbeat) >= this.TIME_BETWEEN_HEARTBEATS) {
			// time to play another heartbeat
			this.lastHeartbeat = this.gameTime;

			var distance = this.distanceToGrandpa();
			var volume = 1.0 - (distance / 800.0);
			//Mix_Volume(-1, (int)volume);
			//Mix_PlayChannel(-1, heartbeatWave, 0);

			$("#audio-heartbeat")[0].volume = volume;
			$("#audio-heartbeat")[0].play();
		}
	};

	this.printStatistics = function () {
		console.log("Distance to grandpa => " + this.distanceToGrandpa());
		console.log("FPS: " + this.framesDrawn);
	};

	this.updateBorder = function () {

		var A0 = 200;
		var A1 = 400;
		var diff = this.gameTime - this.lastHeartbeat;

		var distance = this.distanceToGrandpa();
		var borderWidth = Math.max(30 - 26 * (distance / 500), 1);

		var red = "#aa0000";
		var pink = "#ff5555";
		var c = (diff >= A0 && diff <= A1) ? pink : red;
		$(".border").css("border", "" + borderWidth + "px solid " + c);
	};

	this.gamePlayTick = function () {

		this.framesDrawn++;

		if (!this.paused) {
			this.processInput();
			this.singleZombieStep();
			this.updateSound();
			this.updateBorder();
		}

		if ((Date.now() - this.lastStatisticsTimestamp) >= 1000) {
			this.printStatistics();
			this.framesDrawn = 0;
			this.lastStatisticsTimestamp = Date.now();
		}
	};

	this.hitOrMissTick = function () {
		this.singleZombieStep();

		if (this.keys & this.KEY_ACTION) {
			// only after 3 seconds
			var diff = this.gameTime - this.hitMissFields.startTime;
			if (diff >= 3000) {
				this.keys = 0;
				this.initMenu();
			}
		}
	};

	this.gameTick = function () {
		var that = this;
		window.requestAnimFrame(function () {
			that.gameTick()
		});

		this.gameTime = Date.now();

		switch (this.gameState) {
			case this.GAME_STATE_PLAYING:
				this.gamePlayTick();
				break;

			case this.GAME_STATE_HIT:
			case this.GAME_STATE_MISS:
				this.hitOrMissTick();
				break;

			case this.GAME_STATE_HEARTATTACK:
				this.heartattackTick();
				break;

			case this.GAME_STATE_MENU:
				this.menuGameTick();
				break;
		}
	};

	this.run = function () {
		var that = this;
		window.requestAnimFrame(function () {
			that.gameTick()
		});
	}
}

var game;

$(document).ready(function () {
	game = new GrandpaGame();

	game.initialize();
	game.run();

	$("#canvas").focus();
});
