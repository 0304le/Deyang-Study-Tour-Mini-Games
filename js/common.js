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

  /* ====== 图片双源加载：国内 CDN(jsDelivr) 优先，GitHub 源自动回退 ====== */
  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/0304le/Deyang-Study-Tour-Mini-Games@main/';
  function cdn(rel) { return CDN_BASE + rel; }
  // rel 形如 'assets/img/g8-1-xiangfeng.jpg'；成功 cb(实际可用URL)，两路皆败 cb(null)
  function loadImg(rel, cb) {
    var settled = false;
    var fb = new Image();
    fb.onload = function () { if (!settled) { settled = true; cb(rel); } };
    fb.onerror = function () { if (!settled) { settled = true; cb(null); } };
    var im = new Image();
    im.onload = function () { if (!settled) { settled = true; cb(CDN_BASE + rel); } };
    im.onerror = function () { fb.src = rel; };
    im.src = CDN_BASE + rel;
  }

  var registry = {};

  function register(id, def) { registry[id] = def; }

  /* ====== 关卡密钥解锁 ====== */
  var UNLOCK_KEY = 'deyang_unlocked_v1';
  // 密钥以 djb2 哈希存储，避免答案以明文直接暴露在源码中
  var KEY_HASHES = {
    g1: 2088297134, g2: 2088298390, g3: 2088360296,
    g4: 2088288693, g5: 2088262359, g6: 2088255818,
    g7: 2088254731, g8: 2088330893, g9: 2088261235
  };
  function djb2(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function getUnlocks() {
    try { return JSON.parse(localStorage.getItem(UNLOCK_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setUnlock(id) {
    var u = getUnlocks();
    u[id] = 1;
    try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(u)); } catch (e) {}
  }
  // 已输入过密钥 或 已通关，均视为已解锁
  function isUnlocked(id) { return !!getUnlocks()[id] || Store.has(id); }

  function askKey(id, def, onOk) {
    var exist = document.querySelector('.key-layer');
    if (exist) exist.remove();

    var layer = el('div', 'key-layer name-layer');
    layer.innerHTML =
      '<div class="name-card key-card">' +
        '<button class="name-close" type="button" aria-label="关闭">&times;</button>' +
        '<div class="name-icon">🔐</div>' +
        '<h3>本关需要通关密钥</h3>' +
        '<p class="name-sub">' + def.guide + '｜' + def.title + '<br>请输入 4 位通关密钥开启本关</p>' +
        '<input class="name-input key-input" type="text" inputmode="numeric" maxlength="4" ' +
          'placeholder="••••" autocomplete="off" style="text-align:center;font-size:22px;letter-spacing:10px;padding-left:24px">' +
        '<p class="key-err"></p>' +
        '<div class="name-btns">' +
          '<button class="btn btn-sm key-go" type="button">解锁进入</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    var input = layer.querySelector('.key-input');
    var err = layer.querySelector('.key-err');
    setTimeout(function () { input.focus(); }, 100);

    function close() {
      layer.remove();
      document.body.style.overflow = '';
    }
    function wrong() {
      err.textContent = '× 密钥不正确，请查证后再试';
      var card = layer.querySelector('.key-card');
      card.classList.remove('key-shake');
      void card.offsetWidth; // 重启动画
      card.classList.add('key-shake');
      input.value = '';
      input.focus();
    }
    function submit() {
      var val = input.value.trim();
      if (!val) { input.focus(); return; }
      if (KEY_HASHES[id] && djb2(val) === KEY_HASHES[id]) {
        setUnlock(id);
        close();
        onOk();
      } else {
        wrong();
      }
    }
    // 只允许数字（保留前导零）
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 4);
      err.textContent = '';
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') close();
    });
    layer.querySelector('.key-go').addEventListener('click', submit);
    layer.querySelector('.name-close').addEventListener('click', close);
    layer.addEventListener('click', function (e) { if (e.target === layer) close(); });
  }

  function open(id) {
    var def = registry[id];
    if (!def) return;
    // 密钥关卡：未解锁先验证密钥
    if (KEY_HASHES[id] && !isUnlocked(id)) {
      askKey(id, def, function () { open(id); });
      return;
    }
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
    isUnlocked: isUnlocked,
    el: el,
    shuffle: shuffle,
    toast: toast,
    cdn: cdn,
    loadImg: loadImg,
    IMG: IMG
  };
})();
