/* main.js — Game loop com timestep fixo + render interpolada. */
(function () {
  "use strict";

  var W = 480, H = 640;
  var STEP = 1 / 60;
  var acc = 0;
  var last = 0;

  function fitCanvas() {
    // CSS já mantém aspect; aqui garantimos nitidez em HiDPI sem quebrar lógica 480x640
    var cv = document.getElementById("game");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    // mantém buffer interno na resolução lógica (pixel-art nítida via CSS upscale)
    cv.width = W;
    cv.height = H;
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  var ctx = null;

  function frame(t) {
    requestAnimationFrame(frame);
    if (!last) last = t;
    var dt = (t - last) / 1000;
    last = t;
    if (dt > 0.25) dt = 0.25; // aba voltou: evita espiral
    // pausa quando aba oculta (economia bateria/mobile)
    if (document.hidden) return;
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 5) {
      Game.update(STEP);
      acc -= STEP;
      n++;
    }
    if (n === 5) acc = 0;
    Game.render();
  }

  window.addEventListener("load", function () {
    ctx = fitCanvas();
    Game.init(ctx);
    Input.init();
    Game.syncHUD();
    requestAnimationFrame(frame);
  });

  window.addEventListener("resize", function () { ctx = fitCanvas(); });
  document.addEventListener("visibilitychange", function () { last = 0; acc = 0; });
})();
