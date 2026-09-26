/* audio.js — SFX sintetizados via Web Audio API. */
(function () {
  "use strict";

  var ctx = null;
  var master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return true;
  }

  function laser() {
    if (!ensure()) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = "square";
    // agudo: 1400 -> 220 em 0.12s
    o.frequency.setValueAtTime(1400 + Math.random() * 200, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.12);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.13);
  }

  function noiseBuffer(dur) {
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // explosão "crushing": ruído + lowpass varrendo + thump grave
  function explosion(big) {
    if (!ensure()) return;
    var t = ctx.currentTime;
    var dur = big ? 0.55 : 0.35;

    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur);
    var filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(big ? 3000 : 2200, t);
    filt.frequency.exponentialRampToValueAtTime(90, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(big ? 0.7 : 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur);

    // corpo grave (crush)
    var o = ctx.createOscillator();
    var og = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(big ? 160 : 130, t);
    o.frequency.exponentialRampToValueAtTime(28, t + dur);
    og.gain.setValueAtTime(0.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(og);
    og.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function waveClear() {
    if (!ensure()) return;
    var t = ctx.currentTime;
    var notes = [523, 659, 784, 1046];
    for (var i = 0; i < notes.length; i++) {
      (function (n, off) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = "square";
        o.frequency.value = n;
        g.gain.setValueAtTime(0.22, t + off);
        g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.14);
        o.connect(g);
        g.connect(master);
        o.start(t + off);
        o.stop(t + off + 0.15);
      })(notes[i], i * 0.09);
    }
  }

  function playerDeath() {
    explosion(true);
  }

  window.AudioSys = {
    unlock: ensure,
    laser: laser,
    explosion: function () { explosion(false); },
    playerDeath: playerDeath,
    waveClear: waveClear
  };

  // Desbloqueio no primeiro gesto (exigência dos browsers + mobile)
  function unlockOnce() {
    ensure();
    window.removeEventListener("pointerdown", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
  }
  window.addEventListener("pointerdown", unlockOnce);
  window.addEventListener("keydown", unlockOnce);
})();
