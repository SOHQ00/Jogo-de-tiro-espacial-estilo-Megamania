/* entities.js — Player, pools de projéteis, partículas. Colisão AABB. */
(function () {
  "use strict";

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function BulletPool(max, w, h, speed) {
    this.items = [];
    for (var i = 0; i < max; i++) this.items.push({ x: 0, y: 0, active: false });
    this.max = max;
    this.w = w;
    this.h = h;
    this.speed = speed; // px/s (negativo = sobe)
  }
  BulletPool.prototype.spawn = function (x, y) {
    for (var i = 0; i < this.max; i++) {
      var b = this.items[i];
      if (!b.active) {
        b.active = true;
        b.x = x - this.w / 2;
        b.y = y;
        return b;
      }
    }
    return null; // pool cheio: descarta (arcade: cadência limitada)
  };
  BulletPool.prototype.update = function (dt, top, bottom) {
    for (var i = 0; i < this.max; i++) {
      var b = this.items[i];
      if (!b.active) continue;
      b.y += this.speed * dt;
      if (b.y + this.h < top || b.y > bottom) b.active = false;
    }
  };
  BulletPool.prototype.clear = function () {
    for (var i = 0; i < this.max; i++) this.items[i].active = false;
  };
  BulletPool.prototype.anyActive = function () {
    for (var i = 0; i < this.max; i++) if (this.items[i].active) return true;
    return false;
  };

  function Player() {
    this.w = 45;
    this.h = 36;
    this.x = 480 / 2 - this.w / 2;
    this.y = 640 - 78;
    this.speed = 330;
    this.cool = 0;
    this.coolMax = 0.17;
    this.alive = true;
    this.inv = 0; // invencibilidade pós-respawn
  }
  Player.prototype.reset = function () {
    this.x = 480 / 2 - this.w / 2;
    this.alive = true;
    this.cool = 0;
    this.inv = 2.0;
  };

  function Enemy(x, y, type, phase) {
    this.baseX = x;
    this.x = x;
    this.y = y;
    this.type = type;
    this.phase = phase || 0;
    this.alive = true;
    this.w = 42;
    this.h = 33;
    // ajusta hitbox pelo sprite real (proporcional, com margem arcade justa)
    if (window.Sprites && window.Sprites.sizes[type]) {
      var s = window.Sprites.sizes[type];
      this.w = Math.max(28, s.w - 8);
      this.h = Math.max(24, s.h - 6);
    }
  }

  function Particles(max) {
    this.items = [];
    for (var i = 0; i < (max || 120); i++) {
      this.items.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: "#fff", size: 3, active: false });
    }
  }
  Particles.prototype.burst = function (x, y, colors, n, spd) {
    var c = 0;
    for (var i = 0; i < this.items.length && c < n; i++) {
      var p = this.items[i];
      if (p.active) continue;
      var a = Math.random() * Math.PI * 2;
      var s = (spd || 160) * (0.4 + Math.random() * 0.9);
      p.active = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.max = p.life = 0.35 + Math.random() * 0.4;
      p.color = colors[(Math.random() * colors.length) | 0];
      p.size = 2 + ((Math.random() * 3) | 0);
      c++;
    }
  };
  Particles.prototype.update = function (dt) {
    for (var i = 0; i < this.items.length; i++) {
      var p = this.items[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 1.6 * dt);
      p.vy *= (1 - 1.6 * dt);
    }
  };
  Particles.prototype.clear = function () {
    for (var i = 0; i < this.items.length; i++) this.items[i].active = false;
  };

  window.Ent = {
    aabb: aabb,
    BulletPool: BulletPool,
    Player: Player,
    Enemy: Enemy,
    Particles: Particles
  };
})();
