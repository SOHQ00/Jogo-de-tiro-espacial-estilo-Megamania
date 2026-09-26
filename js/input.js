/* input.js — Abstração em AÇÕES: left, right, fire + mira por arrasto. */
(function () {
  "use strict";

  var Input = {
    left: false,
    right: false,
    fire: false,
    targetX: null, // coordenada lógica 0..480 quando arrastando no canvas
    _kLeft: false,
    _kRight: false,
    _kFire: false,
    _bLeft: false,
    _bRight: false,
    _bFire: false,
    _dragging: false
  };

  function recompute() {
    Input.left = Input._kLeft || Input._bLeft;
    Input.right = Input._kRight || Input._bRight;
    Input.fire = Input._kFire || Input._bFire || Input._dragFire;
  }
  Input._dragFire = false;

  window.Input = Input;

  function bindKeyboard() {
    window.addEventListener("keydown", function (e) {
      if (e.repeat) { if (e.code === "Space") e.preventDefault(); return; }
      switch (e.code) {
        case "ArrowLeft": case "KeyA": Input._kLeft = true; break;
        case "ArrowRight": case "KeyD": Input._kRight = true; break;
        case "Space": case "ArrowUp": case "KeyW": Input._kFire = true; break;
        default: return;
      }
      recompute();
      if (e.code === "Space" || e.code === "ArrowUp") e.preventDefault();
      if (window.Game && window.Game.onPress) window.Game.onPress();
    });
    window.addEventListener("keyup", function (e) {
      switch (e.code) {
        case "ArrowLeft": case "KeyA": Input._kLeft = false; break;
        case "ArrowRight": case "KeyD": Input._kRight = false; break;
        case "Space": case "ArrowUp": case "KeyW": Input._kFire = false; break;
        default: return;
      }
      recompute();
    });
  }

  function canvasX(clientX) {
    var cv = document.getElementById("game");
    var r = cv.getBoundingClientRect();
    var fx = (clientX - r.left) / r.width;
    return fx * 480;
  }

  function bindPointer() {
    var cv = document.getElementById("game");
    cv.addEventListener("pointerdown", function (e) {
      if (window.AudioSys) window.AudioSys.unlock();
      if (window.Game && window.Game.onPress) window.Game.onPress();
      // toque/arrasto no canvas: move a nave até o dedo + atira junto
      Input._dragging = true;
      Input.targetX = canvasX(e.clientX);
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      Input._dragFire = (e.pointerType === "touch" || e.pointerType === "pen");
      recompute();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!Input._dragging) return;
      Input.targetX = canvasX(e.clientX);
    });
    function endDrag(e) {
      Input._dragging = false;
      Input.targetX = null;
      Input._dragFire = false;
      recompute();
    }
    cv.addEventListener("pointerup", endDrag);
    cv.addEventListener("pointercancel", endDrag);

    function hold(btn, set) {
      var el = document.getElementById(btn);
      if (!el) return;
      var on = function (e) {
        e.preventDefault();
        if (window.AudioSys) window.AudioSys.unlock();
        if (window.Game && window.Game.onPress) window.Game.onPress();
        set(true);
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      };
      var off = function (e) { e.preventDefault(); set(false); };
      el.addEventListener("pointerdown", on);
      el.addEventListener("pointerup", off);
      el.addEventListener("pointercancel", off);
      el.addEventListener("lostpointercapture", function () { set(false); });
    }
    hold("btnLeft", function (v) { Input._bLeft = v; recompute(); });
    hold("btnRight", function (v) { Input._bRight = v; recompute(); });
    hold("btnFire", function (v) { Input._bFire = v; recompute(); });

    // overlay: qualquer toque tenta iniciar
    var ov = document.getElementById("overlay");
    if (ov) ov.addEventListener("pointerdown", function () {
      if (window.AudioSys) window.AudioSys.unlock();
      if (window.Game && window.Game.onPress) window.Game.onPress();
    });
  }

  Input.init = function () {
    bindKeyboard();
    bindPointer();
    recompute();
  };
})();
