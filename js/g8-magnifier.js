/* 游戏8：文创美育讲解员 —— 放大镜识别蜀锦纹样（四种纹样连考） */
(function () {
  'use strict';

  var ZOOM = 2.6, LENS = 150;

  // 图片已下载为本地静态文件（assets/img/），不再依赖在线文生图接口，秒开且稳定
  var PATTERNS = [
    {
      v: 'xiangfeng', t: '翔凤穿花纹',
      img: 'assets/img/g8-1-xiangfeng.jpg',
      hint: '镜中可见凤鸟展翅、尾翎修长，穿行于牡丹团花与祥云之间。'
    },
    {
      v: 'badayun', t: '八达晕纹',
      img: 'assets/img/g8-2-badayun.jpg',
      hint: '镜中是以直线构成的米字几何骨架，向八方延伸，格子里填着花卉。'
    },
    {
      v: 'tianma', t: '联珠天马纹',
      img: 'assets/img/g8-3-tianma.jpg',
      hint: '镜中是一圈圆珠围成的圆环，环内有一匹生着翅膀的天马在奔腾。'
    },
    {
      v: 'denglong', t: '灯笼八吉纹',
      img: 'assets/img/g8-4-denglong.jpg',
      hint: '镜中是一盏盏宫灯，灯下有流苏、盘长结和八吉祥杂宝。'
    },
    { v: 'juancao', t: '卷草牡丹纹' },
    { v: 'ruilu', t: '瑞鹿衔芝纹' },
    { v: 'yueling', t: '月华三多纹' },
    { v: 'quchi', t: '曲水寒冰纹' }
  ];

  G.register('g8', {
    guide: '文创美育讲解员',
    title: '放大镜 · 蜀锦纹样识别',
    frag: '锦纹',
    tagline: '寸锦寸金，织就风华；一丝一线，纹样千年。',

    mount: function (root, api) {
      var rounds = G.shuffle(PATTERNS.slice(0, 4)); // 四种正确纹样随机顺序
      var roundIdx = 0;
      var won = false;
      var wrongSet = {};

      /* ====== 图片加载：真实 <img> 先走 CDN，失败立刻切回 GitHub 源（与其他关卡完全相同的机制） ====== */
      var imgState = {}; // 相对路径 -> {ok, loading, fails, url, waiters, probe}

      function fetchImg(rel) {
        var st = imgState[rel] ||
          (imgState[rel] = { ok: false, loading: false, fails: 0, url: null, waiters: [], probe: null });
        if (st.ok || st.loading) return st;
        st.loading = true;

        var viaCdn = true, timer = null;
        var probe = document.createElement('img');
        probe.setAttribute('alt', '');
        probe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
        st.probe = probe;

        function notify(ok, phase) {
          st.waiters.slice().forEach(function (cb) { cb(ok, phase); });
        }
        function cleanup() {
          if (timer) clearTimeout(timer);
          if (probe.parentNode) probe.parentNode.removeChild(probe);
          st.probe = null;
        }
        function done() {
          st.ok = true; st.loading = false; st.fails = 0;
          st.url = probe.getAttribute('src');
          cleanup();
          notify(true, 'ok');
          st.waiters = [];
        }
        function failed() {
          cleanup();
          st.loading = false;
          if (st.fails < 2) {
            st.fails++;
            notify(false, 'retrying');
            setTimeout(function () { fetchImg(rel); }, 1200);
          } else {
            notify(false, 'fatal');
          }
        }
        probe.onload = function () { done(); };
        probe.onerror = function () {
          if (timer) { clearTimeout(timer); timer = null; }
          if (viaCdn) {
            viaCdn = false; // CDN 不通，同一机制立刻换 GitHub 源
            timer = setTimeout(failed, 20000);
            probe.src = rel;
          } else {
            failed();
          }
        };
        root.appendChild(probe);
        timer = setTimeout(failed, 12000);
        probe.src = G.cdn(rel);
        return st;
      }
      // 等待某张图就绪；cb(phase): ok / retrying / fatal
      function whenReady(rel, cb) {
        var st = imgState[rel];
        if (st && st.ok) { cb('ok'); return; }
        fetchImg(rel).waiters.push(function (ok, phase) { cb(ok ? 'ok' : phase); });
      }
      function prefetchNext() {
        if (roundIdx + 1 < rounds.length) fetchImg(rounds[roundIdx + 1].img);
      }

      function renderRound() {
        var cur = rounds[roundIdx];
        // 每题：正确项 + 5 个干扰项
        var distractors = G.shuffle(PATTERNS.filter(function (p) { return p.v !== cur.v; })).slice(0, 5);
        var opts = G.shuffle([cur].concat(distractors));

        root.innerHTML =
          '<div class="game-tip">蜀锦位列中国四大名锦，"寸锦寸金"。在织锦图上<b>移动鼠标</b>用放大镜细看局部，' +
          '再选出正确纹样名。共 <b>4 幅锦样</b>，选错的选项会永久灰掉，可借助放大镜再观察。</div>' +
          '<div class="mag-progress">' +
            rounds.map(function (r, i) {
              return '<span class="mp-dot' + (i < roundIdx ? ' done' : (i === roundIdx ? ' current' : '')) + '">' +
                (i < roundIdx ? '✓' : (i + 1)) + '</span>';
            }).join('') +
          '</div>' +
          '<div class="mag-wrap">' +
            '<div class="mag-board"><div class="mag-lens"></div>' +
              '<div class="mag-mask"><span class="mag-spinner"></span><span class="mag-mask-text">图片加载中 · 请稍候</span>' +
              '<button type="button" class="mag-retry" hidden>图片加载失败，点此重新加载</button></div>' +
            '</div>' +
            '<div class="mag-side">' +
              '<h3>第 ' + (roundIdx + 1) + ' / 4 幅锦样</h3>' +
              '<p class="mag-hint">🔍 ' + cur.hint + '</p>' +
              '<div class="mag-opts">' +
                opts.map(function (o) {
                  var disabled = wrongSet[cur.v] && wrongSet[cur.v][o.v];
                  return '<button class="mag-opt' + (disabled ? ' disabled' : '') + '" data-v="' + o.v + '"' +
                    (disabled ? ' disabled' : '') + ' type="button">' + o.t + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>';

        var board = root.querySelector('.mag-board');
        var lens = root.querySelector('.mag-lens');
        var mask = root.querySelector('.mag-mask');
        var spinner = root.querySelector('.mag-spinner');
        var maskText = root.querySelector('.mag-mask-text');
        var retryBtn = root.querySelector('.mag-retry');
        // 等图片真正就绪再显示；切换中/重试中/失败均有对应提示
        board.style.backgroundImage = 'none';
        lens.style.backgroundImage = 'none';

        function showMask(mode) {
          mask.hidden = false;
          if (mode === 'fatal') {
            spinner.hidden = true;
            maskText.textContent = '图片加载遇到问题';
            retryBtn.hidden = false;
          } else {
            spinner.hidden = false;
            retryBtn.hidden = true;
            maskText.textContent = mode === 'retrying' ? '正在切换线路 · 请稍候' : '图片加载中 · 请稍候';
          }
        }
        function applyImage() {
          if (rounds[roundIdx] && rounds[roundIdx].img === cur.img) {
            var st = imgState[cur.img];
            var u = (st && st.url) ? st.url : cur.img;
            mask.hidden = true;
            board.style.backgroundImage = 'url("' + u + '")';
            lens.style.backgroundImage = 'url("' + u + '")';
            prefetchNext(); // 本图就绪后再后台预取下一幅
          }
        }
        showMask('loading');
        whenReady(cur.img, function (phase) {
          if (phase === 'ok') applyImage();
          else if (phase === 'retrying') showMask('retrying');
          else showMask('fatal');
        });
        retryBtn.addEventListener('click', function () {
          delete imgState[cur.img]; // 手动重试：彻底重置，重新从 CDN 开始
          showMask('loading');
          whenReady(cur.img, function (phase) {
            if (phase === 'ok') applyImage();
            else if (phase === 'retrying') showMask('retrying');
            else showMask('fatal');
          });
        });

        board.addEventListener('pointermove', function (e) {
          var r = board.getBoundingClientRect();
          var x = e.clientX - r.left;
          var y = e.clientY - r.top;
          lens.style.display = 'block';
          var lx = Math.max(0, Math.min(r.width - LENS, x - LENS / 2));
          var ly = Math.max(0, Math.min(r.height - LENS, y - LENS / 2));
          lens.style.left = lx + 'px';
          lens.style.top = ly + 'px';
          lens.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
          lens.style.backgroundPosition =
            (-(x * ZOOM - LENS / 2)) + 'px ' + (-(y * ZOOM - LENS / 2)) + 'px';
        });
        board.addEventListener('pointerleave', function () { lens.style.display = 'none'; });

        root.querySelectorAll('.mag-opt').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (btn.disabled) return;
            if (btn.dataset.v === cur.v) {
              btn.classList.add('right');
              api.toast('判断正确！此乃「' + cur.t + '」');
              roundIdx++;
              setTimeout(function () {
                if (roundIdx >= rounds.length) {
                  if (!won) { won = true; api.win(); }
                } else {
                  renderRound();
                }
              }, 800);
            } else {
              btn.classList.add('wrong', 'disabled');
              btn.disabled = true;
              if (!wrongSet[cur.v]) wrongSet[cur.v] = {};
              wrongSet[cur.v][btn.dataset.v] = 1;
              board.classList.remove('mag-shake');
              void board.offsetWidth;
              board.classList.add('mag-shake');
              api.toast('不是这个纹样，再用放大镜细看特征');
            }
          });
        });
      }

      renderRound();
    }
  });
})();
