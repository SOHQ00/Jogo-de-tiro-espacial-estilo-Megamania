/* levels.js — Definição das 5 ondas + escalonamento por nível. */
(function () {
  "use strict";

  // speed: descida px/s | amp: zig-zag px | freq: rad/s | fire: [min,max]s
  var LEVELS = [
    { key: "burger",  nome: "HAMBÚRGUERES",      count: 7, speed: 26, amp: 70, freq: 1.1, fire: [1.4, 2.6], pts: 100 },
    { key: "cookie",  nome: "BOLACHAS",          count: 8, speed: 32, amp: 85, freq: 1.4, fire: [1.2, 2.3], pts: 150 },
    { key: "iron",    nome: "FERROS DE PASSAR",  count: 8, speed: 38, amp: 95, freq: 1.7, fire: [1.0, 2.0], pts: 200 },
    { key: "bow",     nome: "GRAVATAS BORBOLETA",count: 9, speed: 46, amp: 110,freq: 2.0, fire: [0.9, 1.8], pts: 250 },
    { key: "diamond", nome: "DIAMANTES",         count: 9, speed: 55, amp: 125,freq: 2.4, fire: [0.8, 1.6], pts: 300 }
  ];

  function get(level) {
    // level 1-based; após 5, repete com multiplicador
    var loop = Math.floor((level - 1) / LEVELS.length);
    var base = LEVELS[(level - 1) % LEVELS.length];
    var mult = 1 + loop * 0.22 + (level - 1) * 0.06;
    return {
      key: base.key,
      nome: base.nome,
      count: Math.min(10, base.count + loop),
      speed: base.speed * mult,
      amp: Math.min(150, base.amp + loop * 8),
      freq: base.freq * (1 + loop * 0.08),
      fire: [Math.max(0.45, base.fire[0] / mult), Math.max(0.7, base.fire[1] / mult)],
      pts: Math.round(base.pts * (1 + (level - 1) * 0.25)),
      level: level,
      loop: loop
    };
  }

  window.Levels = { all: LEVELS, get: get };
})();
