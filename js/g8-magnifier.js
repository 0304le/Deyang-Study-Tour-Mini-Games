/* 游戏8：文创美育讲解员 —— 放大镜识别蜀锦纹样（四种纹样连考） */
(function () {
  'use strict';

  var ZOOM = 2.6, LENS = 150;

  // 全部候选纹样（正确项 + 干扰项池）
  var PATTERNS = [
    {
      v: 'xiangfeng', t: '翔凤穿花纹',
      img: G.IMG('蜀锦织锦纹样方形图案特写，对称构图的翔凤穿花纹，一只凤凰展翅飞舞穿梭于团花祥云之间，传统红金配色，织纹精致繁复高清', 'square_hd'),
      hint: '镜中可见凤鸟展翅、尾翎修长，穿行于牡丹团花与祥云之间。'
    },
    {
      v: 'badayun', t: '八达晕纹',
      img: G.IMG('蜀锦织锦纹样方形图案特写，八达晕几何骨架纹，米字格与圆形套叠的对称几何网络，骨架内填花卉如意纹，宋代风格红褐金配色，织纹精致高清', 'square_hd'),
      hint: '镜中是以直线构成的米字几何骨架，向八方延伸，格子里填着花卉。'
    },
    {
      v: 'tianma', t: '联珠天马纹',
      img: G.IMG('蜀锦织锦纹样方形图案特写，联珠天马纹，圆形连珠纹圈环内一匹带翼天马昂首奔腾，唐代风格深蓝底配金橙联珠，织纹精致高清', 'square_hd'),
      hint: '镜中是一圈圆珠围成的圆环，环内有一匹生着翅膀的天马在奔腾。'
    },
    {
      v: 'denglong', t: '灯笼八吉纹',
      img: G.IMG('蜀锦织锦纹样方形图案特写，灯笼八吉纹，一盏盏宫灯造型对称排列，灯下垂流苏与盘长结、八吉祥纹样，明代风格红金喜庆配色，织纹精致高清', 'square_hd'),
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

      /* ====== 图片预加载：文生图接口生成需数秒，必须等图就绪再显示 ====== */
      var imgState = {}; // url -> {ok:bool, im:Image, cbs:[]}

      // 进入即并行预加载全部 4 幅，答第一题时其余图已在后台生成，切关秒开
      rounds.forEach(function (r) { preload(r.img, function () {}); });

      function preload(url, onReady) {
        var st = imgState[url];
        if (!st) {
          st = imgState[url] = { ok: false, im: null, cbs: [] };
        }
        if (st.ok) { onReady(); return; }
        st.cbs.push(onReady);
        if (st.im) return; // 已在加载中，等回调即可
        var im = new Image();
        st.im = im;
        im.onload = function () {
          st.ok = true;
          st.cbs.forEach(function (cb) { cb(); });
          st.cbs = [];
        };
        im.onerror = function () {
          // 生成偶发失败：3 秒后自动重试一次
          st.im = null;
          setTimeout(function () { preload(url, function () {}); }, 3000);
        };
        im.src = url;
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
            '<div class="mag-board"><div class="mag-lens"></div></div>' +
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
        // 等图片真正就绪再显示，加载期间展示"织造中"提示
        board.classList.add('mag-loading');
        board.style.backgroundImage = 'none';
        lens.style.backgroundImage = 'none';
        preload(cur.img, function () {
          // 玩家可能已切到下一幅，仅当仍是当前图时才应用
          if (rounds[roundIdx] && rounds[roundIdx].img === cur.img) {
            board.classList.remove('mag-loading');
            board.style.backgroundImage = 'url("' + cur.img + '")';
            lens.style.backgroundImage = 'url("' + cur.img + '")';
          }
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
