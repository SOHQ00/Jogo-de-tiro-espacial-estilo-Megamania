/* sprites.js — Pixel-art procedural 8-bit. Sem assets externos. */
(function () {
  "use strict";

  var PX = 3; // tamanho do "pixel" 8-bit em px do canvas offscreen

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w * PX;
    c.height = h * PX;
    return c;
  }

  // map: array de strings. palette: {char: cor}. '.' = transparente
  function build(map, palette) {
    var h = map.length;
    var w = map[0].length;
    var c = makeCanvas(w, h);
    var ctx = c.getContext("2d");
    for (var y = 0; y < h; y++) {
      var row = map[y];
      for (var x = 0; x < w; x++) {
        var ch = row[x];
        if (ch === "." || ch === " ") continue;
        var col = palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * PX, y * PX, PX, PX);
      }
    }
    return c;
  }

  var PAL_PLAYER = { W: "#00FFFF", C: "#00AAAA", R: "#FF2222", O: "#FF8800", S: "#FFFFFF" };
  var MAP_PLAYER = [
    ".......WW.......",
    ".......WW.......",
    "......WWWW......",
    "......WWWW......",
    "......WWWW......",
    "..R...WWWW...R..",
    "..RR.WWWWWW.RR..",
    "..RRRWWWWWWRRR..",
    ".ORRRWWWWWWRRRO.",
    ".OWWWWWWWWWWWWO.",
    "OWWWWWWWWWWWWWWO",
    "SWWWWWWWWWWWWWWS"
  ];

  var PAL_BURGER = { Y: "#FFD23F", W: "#FFFFFF", G: "#39FF14", R: "#FF3131", E: "#FF8C00", N: "#8B4513", D: "#5C3317" };
  var MAP_BURGER = [
    ".....YYYYYY.....",
    "...YYYYYYYYYY...",
    "..WWYYYYYYWWYY..",
    "..YYYYYYYYYYYY..",
    ".GGGGGGGGGGGGGG.",
    ".RRRRRRRRRRRRRR.",
    "EEEEEEEEEEEEEEEE",
    "NNNNNNNNNNNNNNNN",
    "DDDDDDDDDDDDDDDD",
    "..YYYYYYYYYYYY..",
    "....YYYYYYYY...."
  ];

  var PAL_COOKIE = { Y: "#F5DEB3", D: "#C89B5A", N: "#4A2C0A", W: "#FFFFFF" };
  var MAP_COOKIE = [
    ".....YYYYYY.....",
    "...YYYYYYYYYY...",
    "..YYYYYYYYYYYY..",
    ".YYYNYYYYYNYYY..",
    ".YYYYYYYYYYYYY..",
    "YYYYYNYYYYYYNYYY",
    "YYYYYYYYYYYYYYYY",
    "YYYYNYYYYYYNYYYY",
    ".YYYYYYYYYYYYY..",
    ".YYYNYYYYYNYYY..",
    "..YYYYYYYYYYYY..",
    "...YYYYYYYYYY...",
    ".....YYYYYY....."
  ];

  var PAL_IRON = { G: "#9AA0A6", D: "#5F6368", B: "#00BFFF", W: "#FFFFFF", R: "#FF2222" };
  var MAP_IRON = [
    ".....GGGGG......",
    "....GG...GG.....",
    "....GGGGGGG.....",
    "...BBBBBBBBB....",
    "..BBBBBBBBBBB...",
    "..BBWBBBBBBBBB..",
    ".BBBBBBBBBBBBB..",
    ".BBBBBBBBBBBBBB.",
    "BBBBBBBBBBBBBBBB",
    "DDDDDDDDDDDDDDDD"
  ];

  var PAL_BOW = { R: "#FF2E88", D: "#B3134D", W: "#FFFFFF", Y: "#FFFF00" };
  var MAP_BOW = [
    "RRR..........RRR",
    "RRRRR......RRRRR",
    "RRRRRRR..RRRRRRR",
    "RRRRRRRRRRRRRRRR",
    "RRRRRRRWWRRRRRRR",
    "RRRRRRRYWRRRRRRR",
    "RRRRRRRWWRRRRRRR",
    "RRRRRRRRRRRRRRRR",
    "RRRRRRR..RRRRRRR",
    "RRRRR......RRRRR",
    "RRR..........RRR"
  ];

  var PAL_DIAMOND = { C: "#00E5FF", W: "#FFFFFF", B: "#0088AA", P: "#FF4DFF" };
  var MAP_DIAMOND = [
    "......CCCC......",
    ".....CCCCCC.....",
    "....CCWWCCCC....",
    "...CCWWCCCCCC...",
    "..CCCCCCCCCCCC..",
    "...CCCCCCCCCC...",
    "....CCCCCCCC....",
    ".....CCCCCC.....",
    "......CCCC......",
    ".......CC......."
  ];

  function bulletCanvas(w, h, color, glow) {
    var c = makeCanvas(w, h);
    var ctx = c.getContext("2d");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w * PX, h * PX);
    ctx.fillStyle = color;
    var ix = Math.floor(w / 2);
    ctx.fillRect(ix * PX, 0, PX, h * PX);
    return c;
  }

  function explosionFrames() {
    var frames = [];
    var maps = [
      [
        ".......YY.......",
        "......YYYY......",
        "..R..YYYYYY..O..",
        "...RYYYYYYYYO...",
        "....YYYYYYYY....",
        ".OYYYYWWYYYYYR..",
        "..OYYYYWWYYYYR..",
        "....YYYYYYYY....",
        "...OYYYYYYYR....",
        "..O..YYYYYY..R..",
        "......YYYY......",
        ".......YY......."
      ],
      [
        "................",
        "....O....R......",
        ".....OYYR.......",
        "..O.YYYYYY.R....",
        "....YYWWYY..R...",
        ".R.YYWWWWYY.O...",
        "...OYYWWWWYY....",
        "....YYWWYY......",
        ".....YYYYYY.O...",
        "..R..OYYR....O..",
        "......R....O....",
        "................"
      ]
    ];
    var pal = { Y: "#FFFF00", O: "#FF8800", R: "#FF2222", W: "#FFFFFF" };
    for (var i = 0; i < maps.length; i++) frames.push(build(maps[i], pal));
    return frames;
  }

  function starCanvas() {
    var c = document.createElement("canvas");
    c.width = 2; c.height = 2;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 2, 2);
    return c;
  }

  window.Sprites = {
    PX: PX,
    player: null,
    enemies: {},
    playerBullet: null,
    enemyBullet: null,
    boom: [],
    star: null,
    sizes: {}, // larguras lógicas (sem PX) para hitboxes consistentes
    init: function () {
      this.player = build(MAP_PLAYER, PAL_PLAYER);
      this.enemies.burger = build(MAP_BURGER, PAL_BURGER);
      this.enemies.cookie = build(MAP_COOKIE, PAL_COOKIE);
      this.enemies.iron = build(MAP_IRON, PAL_IRON);
      this.enemies.bow = build(MAP_BOW, PAL_BOW);
      this.enemies.diamond = build(MAP_DIAMOND, PAL_DIAMOND);
      this.playerBullet = bulletCanvas(3, 7, "#FFFFFF", "#00FFFF");
      this.enemyBullet = bulletCanvas(3, 6, "#FFFF00", "#FF00FF");
      this.boom = explosionFrames();
      this.star = starCanvas();
      // tamanhos lógicos (px na tela = canvas.width)
      this.sizes.player = { w: this.player.width, h: this.player.height };
      for (var k in this.enemies) {
        this.sizes[k] = { w: this.enemies[k].width, h: this.enemies[k].height };
      }
      this.sizes.playerBullet = { w: this.playerBullet.width, h: this.playerBullet.height };
      this.sizes.enemyBullet = { w: this.enemyBullet.width, h: this.enemyBullet.height };
    }
  };
})();
