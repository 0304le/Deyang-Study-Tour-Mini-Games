/* 公共框架：游戏注册、弹窗、碎片存储、工具方法 */
(function () {
  'use strict';
  var KEY = 'deyang_culture_fragments_v1';

  var Store = {
    all: function () {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
      catch (e) { return {}; }
    },
    has: function (id) { return !!this.all()[id]; },
    add: function (id) {
      var d = this.all();
      d[id] = 1;
      localStorage.setItem(KEY, JSON.stringify(d));
    },
    clear: function () { localStorage.removeItem(KEY); }
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var toastTimer = null;
  function toast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = el('div', 'toast', msg);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2200);
  }

  /** 文生图地址（统一入口，禁止占位图） */
  function IMG(prompt, size) {
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' +
      encodeURIComponent(prompt) + '&image_size=' + size;
  }

  var registry = {};

  function register(id, def) { registry[id] = def; }

  function open(id) {
    var def = registry[id];
    if (!def) return;
    // 防重入：已有游戏弹层时不再重复打开（也能拦截极快的连点）
    var exist = document.querySelector('.game-layer');
    if (exist) return;
    var layer = el('div', 'game-layer');
    layer.innerHTML =
      '<div class="game-box ' + id + '">' +
        '<div class="game-head">' +
          '<div><span class="gh-guide"></span><h2></h2></div>' +
          '<button class="gh-close" type="button" aria-label="关闭">&times;</button>' +
        '</div>' +
        '<div class="game-body"></div>' +
      '</div>';
    layer.querySelector('.gh-guide').textContent = def.guide;
    layer.querySelector('h2').textContent = def.title;
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    var body = layer.querySelector('.game-body');
    var won = false;
    var cleanup = null;

    function close() {
      try { if (cleanup) cleanup(); } catch (e) {}
      layer.remove();
      document.body.style.overflow = '';
      if (window.refreshHub) window.refreshHub();
    }

    layer.querySelector('.gh-close').addEventListener('click', close);
    layer.addEventListener('click', function (e) {
      if (e.target === layer) close();
    });

    var api = {
      root: body,
      close: close,
      toast: toast,
      win: function () {
        if (won) return;
        won = true;
        Store.add(id);
        showWin(layer, def, close);
      }
    };

    cleanup = def.mount(body, api) || null;
  }

  function showWin(layer, def, close) {
    var mask = el('div', 'win-mask');
    mask.innerHTML =
      '<div class="win-card">' +
        '<div class="win-label">通 关 奖 励</div>' +
        '<div class="win-seal">' + def.frag + '</div>' +
        '<h3>获得文化碎片【' + def.frag + '】</h3>' +
        '<p>' + (def.tagline || '') + '</p>' +
        '<button class="btn" type="button">收入囊中</button>' +
      '</div>';
    mask.querySelector('button').addEventListener('click', close);
    layer.querySelector('.game-box').appendChild(mask);
  }

  window.G = {
    register: register,
    open: open,
    Store: Store,
    el: el,
    shuffle: shuffle,
    toast: toast,
    IMG: IMG
  };
})();
