/* game.js — Estado, energia, vidas, score, spawns, colisões, render. */
(function () {
  "use strict";

  var W = 480, H = 640;
  var ENERGY_MAX = 100;
  var ENERGY_DRAIN = 4.2;      // por segundo
  var ENERGY_WAVE_BONUS = 35;  // ao limpar onda
  var TOP_LIMIT = 64, BOTTOM_KILL = 420;

  var Game = {
    state: "menu", // menu | playing | waveclear | dying | gameover
    score: 0,
    hi: 0,
    lives: 3,
    level: 1,
    energy: ENERGY_MAX,
    time: 0,
    wave: null,
    enemies: [],
    player: null,
    pBullets: null,
    eBullets: null,
    parts: null,
    stars: [],
    fireTimer: 1.5,
    stateT: 0,
    shake: 0,
    flashMsg: "",
    flashT: 0,
    ctx: null
  };
  window.Game = Game;

  function $(id) { return document.getElementById(id); }

  Game.init = function (ctx) {
    this.ctx = ctx;
    Sprites.init();
    this.player = new Ent.Player();
    // projéteis rápidos (spec)
    this.pBullets = new Ent.BulletPool(24, Sprites.sizes.playerBullet.w, Sprites.sizes.playerBullet.h, -640);
    this.eBullets = new Ent.BulletPool(8, Sprites.sizes.enemyBullet.w, Sprites.sizes.enemyBullet.h, 240);
    this.parts = new Ent.Particles(140);
    try { this.hi = parseInt(localStorage.getItem("megamania_hi") || "0", 10) || 0; } catch (e) { this.hi = 0; }
    for (var i = 0; i < 70; i++) {
      this.stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.3 ? 2 : 1, v: 20 + Math.random() * 60 });
    }
    this.syncHUD();
  };

  Game.onPress = function () {
    if (this.state === "menu") this.startGame();
    else if (this.state === "gameover" && this.stateT > 0.8) this.startGame();
  };

  Game.startGame = function () {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.energy = ENERGY_MAX;
    this.time = 0;
    this.player.reset();
    this.player.inv = 1.0;
    this.pBullets.clear();
    this.eBullets.clear();
    this.parts.clear();
    this.loadLevel(1);
    this.state = "playing";
    this.stateT = 0;
    this.hideOverlay();
    this.syncHUD();
  };

  Game.loadLevel = function (lv) {
    this.level = lv;
    this.wave = Levels.get(lv);
    this.energy = ENERGY_MAX; // spec: fase nova renova barra
    this.enemies = [];
    var n = this.wave.count;
    var margin = 46;
    for (var i = 0; i < n; i++) {
      var bx = margin + (W - margin * 2) * (n === 1 ? 0.5 : i / (n - 1));
      var y = 96 + (i % 2) * 44;
      var e = new Ent.Enemy(bx, y, this.wave.key, (i / n) * Math.PI * 2);
      this.enemies.push(e);
    }
    this.fireTimer = this.wave.fire[0] + Math.random() * 0.8;
    this.flash("FASE " + lv + " — " + this.wave.nome, 2.2);
    this.syncHUD();
  };

  Game.flash = function (msg, dur) {
    this.flashMsg = msg;
    this.flashT = dur || 2;
  };

  Game.hideOverlay = function () { $("overlay").classList.add("hidden"); };
  Game.showOverlay = function (title, text) {
    $("overlay-title").innerHTML = title;
    $("overlay-text").innerHTML = text;
    $("overlay").classList.remove("hidden");
  };

  function pad(n) {
    var s = String(Math.max(0, n | 0));
    while (s.length < 6) s = "0" + s;
    return s;
  }

  Game.syncHUD = function () {
    $("score").textContent = pad(this.score);
    $("hiscore").textContent = pad(Math.max(this.hi, this.score));
    $("fase").textContent = "FASE " + this.level;
    $("onda-nome").textContent = this.wave ? this.wave.nome : "—";
    $("level-ind").textContent = "Nv " + this.level;
    var lv = "";
    for (var i = 0; i < 3; i++) lv += i < this.lives ? "▲" : "·";
    $("lives").textContent = lv;
    var f = $("energy-fill");
    var pct = Math.max(0, Math.min(100, this.energy));
    f.style.width = pct + "%";
    f.style.background = pct > 55 ? "#0f0" : pct > 25 ? "#ff0" : "#f00";
  };

  Game.loseLife = function (reason) {
    AudioSys.playerDeath();
    this.parts.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2,
      ["#FFFFFF", "#FFFF00", "#FF8800", "#FF2222", "#00FFFF"], 34, 240);
    this.shake = 0.22;
    this.lives--;
    this.eBullets.clear();
    if (this.lives <= 0) {
      this.state = "gameover";
      this.stateT = 0;
      if (this.score > this.hi) {
        this.hi = this.score;
        try { localStorage.setItem("megamania_hi", String(this.hi)); } catch (e) {}
      }
      this.showOverlay("GAME OVER", "Score: " + pad(this.score) + "<br>Toque ou ESPAÇO para jogar de novo");
    } else {
      this.state = "dying";
      this.stateT = 0;
      this.player.alive = false;
      this.energy = ENERGY_MAX; // perde vida -> barra recarrega (evita morte dupla)
    }
    this.syncHUD();
  };

  Game.update = function (dt) {
    this.time += dt;
    this.stateT += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shake > 0) this.shake -= dt;

    // estrelas sempre derivam (fundo preto sólido + poeira estelar sutil)
    for (var s = 0; s < this.stars.length; s++) {
      var st = this.stars[s];
      st.y += st.v * dt;
      if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
    }
    this.parts.update(dt);

    if (this.state === "menu" || this.state === "gameover") return;

    if (this.state === "dying") {
      this.pBullets.update(dt, -40, H + 40);
      this.eBullets.update(dt, -40, H + 40);
      if (this.stateT > 1.4) {
        this.player.reset();
        this.state = "playing";
        this.stateT = 0;
      }
      return;
    }

    if (this.state === "waveclear") {
      this.pBullets.update(dt, -40, H + 40);
      this.eBullets.update(dt, -40, H + 40);
      if (this.stateT > 2.0) {
        this.loadLevel(this.level + 1);
        this.state = "playing";
        this.stateT = 0;
      }
      return;
    }

    // ---- PLAYING ----
    var p = this.player;

    // energia drena sempre; zerar = perde vida (spec)
    this.energy -= ENERGY_DRAIN * dt;
    if (this.energy <= 0) {
      this.energy = 0;
      this.syncHUD();
      this.loseLife("energy");
      return;
    }

    // movimento: arrasto tem prioridade, senão botões/teclado
    if (Input.targetX !== null && Input.targetX !== undefined) {
      var cx = p.x + p.w / 2;
      var dx = Input.targetX - cx;
      var maxStep = p.speed * 1.25 * dt;
      if (Math.abs(dx) <= maxStep) p.x = Input.targetX - p.w / 2;
      else p.x += (dx > 0 ? maxStep : -maxStep);
    } else {
      if (Input.left) p.x -= p.speed * dt;
      if (Input.right) p.x += p.speed * dt;
    }
    if (p.x < 6) p.x = 6;
    if (p.x + p.w > W - 6) p.x = W - 6 - p.w;
    if (p.inv > 0) p.inv -= dt;

    // tiro do jogador: rápido, cadência arcade
    p.cool -= dt;
    if (Input.fire && p.cool <= 0 && p.alive) {
      p.cool = p.coolMax;
      this.pBullets.spawn(p.x + p.w / 2, p.y - 6);
      AudioSys.laser();
    }
    this.pBullets.update(dt, -40, H + 40);

    // inimigos: zig-zag + descida lenta em fileira
    var wv = this.wave;
    var aliveCount = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.alive) continue;
      aliveCount++;
      e.y += wv.speed * dt;
      e.x = e.baseX + Math.sin(this.time * wv.freq + e.phase) * wv.amp;
      if (e.x < 8) e.x = 8;
      if (e.x + e.w > W - 8) e.x = W - 8 - e.w;
      if (e.y > BOTTOM_KILL) e.y = 78; // recicla no topo, mantém pressão
    }

    // tiro inimigo: poucos, um de cada vez (spec)
    this.eBullets.speed = 200 + this.level * 12;
    if (!this.eBullets.anyActive() && aliveCount > 0) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        var cand = [];
        for (var j = 0; j < this.enemies.length; j++) if (this.enemies[j].alive) cand.push(this.enemies[j]);
        var src = cand[(Math.random() * cand.length) | 0];
        // só atira se estiver acima do jogador (evita tiro impossível)
        if (src.y < p.y - 40) {
          this.eBullets.spawn(src.x + src.w / 2, src.y + src.h);
        }
        var fr = wv.fire;
        this.fireTimer = fr[0] + Math.random() * (fr[1] - fr[0]);
      }
    } else {
      this.fireTimer = Math.max(this.fireTimer, 0.25);
    }
    this.eBullets.update(dt, -40, H + 40);

    // ---- colisões arcade (AABB preciso) ----
    // tiro jogador x inimigo
    var pb = this.pBullets.items;
    for (var a = 0; a < pb.length; a++) {
      var b = pb[a];
      if (!b.active) continue;
      for (var k = 0; k < this.enemies.length; k++) {
        var en = this.enemies[k];
        if (!en.alive) continue;
        if (Ent.aabb(b.x, b.y, this.pBullets.w, this.pBullets.h, en.x, en.y, en.w, en.h)) {
          b.active = false;
          en.alive = false;
          this.score += wv.pts;
          AudioSys.explosion();
          this.parts.burst(en.x + en.w / 2, en.y + en.h / 2,
            ["#FFFFFF", "#FFFF00", "#FF8800", "#FF2222"], 22, 200);
          if (this.score > this.hi) this.hi = this.score;
          break;
        }
      }
    }

    // verifica onda limpa
    var left = 0;
    for (var q = 0; q < this.enemies.length; q++) if (this.enemies[q].alive) left++;
    if (left === 0) {
      this.score += 500;
      this.energy = Math.min(ENERGY_MAX, this.energy + ENERGY_WAVE_BONUS);
      AudioSys.waveClear();
      this.flash("ONDA DESTRUÍDA! +500", 2.0);
      this.state = "waveclear";
      this.stateT = 0;
      this.eBullets.clear();
      this.syncHUD();
      return;
    }

    // tiro inimigo x jogador + contato direto destroem a nave (spec)
    if (p.inv <= 0) {
      var eb = this.eBullets.items;
      for (var m = 0; m < eb.length; m++) {
        var eb7 = eb[m];
        if (!eb7.active) continue;
        // hitbox do jogador levemente generosa no centro (arcade justo)
        var px = p.x + 8, py = p.y + 6, pw = p.w - 16, ph = p.h - 10;
        if (Ent.aabb(eb7.x, eb7.y, this.eBullets.w, this.eBullets.h, px, py, pw, ph)) {
          this.loseLife("shot");
          return;
        }
      }
      for (var c = 0; c < this.enemies.length; c++) {
        var en2 = this.enemies[c];
        if (!en2.alive) continue;
        if (Ent.aabb(p.x + 8, p.y + 6, p.w - 16, p.h - 10, en2.x + 4, en2.y + 4, en2.w - 8, en2.h - 8)) {
          // ambos explodem no contato
          en2.alive = false;
          this.parts.burst(en2.x + en2.w / 2, en2.y + en2.h / 2, ["#FFFF00", "#FF8800"], 16, 180);
          this.loseLife("crash");
          return;
        }
      }
    }

    this.syncHUD();
  };

  Game.render = function () {
    var ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // screen shake (curto, 50-200ms efetivos)
    if (this.shake > 0) {
      ctx.translate(((Math.random() - 0.5) * 8) | 0, ((Math.random() - 0.5) * 8) | 0);
    }

    // estrelas
    ctx.fillStyle = "#fff";
    for (var i = 0; i < this.stars.length; i++) {
      var st = this.stars[i];
      ctx.globalAlpha = 0.35 + (i % 3) * 0.2;
      ctx.fillRect(st.x | 0, st.y | 0, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // linha do topo (zona de spawn)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, TOP_LIMIT - 2, W, 2);

    // inimigos
    for (var k = 0; k < this.enemies.length; k++) {
      (function (e) {
        if (!e.alive) return;
        var img = Sprites.enemies[e.type];
        var sw = Sprites.sizes[e.type].w, sh = Sprites.sizes[e.type].h;
        // centraliza sprite na hitbox
        var dx = e.x + e.w / 2 - sw / 2;
        var dy = e.y + e.h / 2 - sh / 2;
        ctx.drawImage(img, Math.round(dx), Math.round(dy));
      })(this.enemies[k]);
    }

    // tiros jogador
    var pbImg = Sprites.playerBullet;
    var pb = this.pBullets.items;
    for (var a = 0; a < pb.length; a++) {
      if (!pb[a].active) continue;
      ctx.drawImage(pbImg, Math.round(pb[a].x - 2), Math.round(pb[a].y));
    }
    // tiros inimigos
    var ebImg = Sprites.enemyBullet;
    var eb = this.eBullets.items;
    for (var m = 0; m < eb.length; m++) {
      if (!eb[m].active) continue;
      ctx.drawImage(ebImg, Math.round(eb[m].x - 2), Math.round(eb[m].y));
    }

    // jogador (pisca se invencível)
    var p = this.player;
    if ((this.state === "playing" || this.state === "waveclear") && p.alive) {
      if (!(p.inv > 0 && (this.time * 12 | 0) % 2 === 0)) {
        ctx.drawImage(Sprites.player, Math.round(p.x + p.w / 2 - Sprites.sizes.player.w / 2), Math.round(p.y));
      }
    }

    // partículas
    var ps = this.parts.items;
    for (var q = 0; q < ps.length; q++) {
      var pt = ps[q];
      if (!pt.active) continue;
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x | 0, pt.y | 0, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // flash de fase no canvas
    if (this.flashT > 0) {
      ctx.fillStyle = "#FF0";
      ctx.font = "bold 20px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.flashMsg, W / 2, H / 2 - 40);
    }

    // energia crítica: borda vermelha pulsante
    if (this.state === "playing" && this.energy < 25) {
      ctx.strokeStyle = (this.time * 6 | 0) % 2 ? "#F00" : "#600";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, W - 4, H - 4);
    }

    ctx.restore();
  };
})();
