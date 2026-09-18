/* 游戏4：非遗讲解员 —— 绵竹年画福娃填色（内联SVG，可点击上色） */
(function () {
  'use strict';

  var COLORS = [
    '#d43a2f', '#f2a0b3', '#e8873a', '#f2c531',
    '#4c9a51', '#3fb6b0', '#3f6fb0', '#8a55a8',
    '#2b2b2b', '#ffffff'
  ];

  // 绵竹年画抱鱼福娃 —— 重新设计，所有 zone 无重叠
  // SVG 渲染顺序：后定义的在上层。鱼身先定义（下层），手后定义（上层），互不干扰
  var SVG =
  '<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg">' +
    // === 底层：头发 ===
    '<circle class="zone" data-name="头发" cx="200" cy="155" r="96"/>' +
    // === 中层：脸 ===
    '<circle class="zone" data-name="脸" cx="200" cy="158" r="82"/>' +
    // 发髻（在后上层）
    '<circle class="zone" data-name="左发髻" cx="122" cy="95" r="28"/>' +
    '<circle class="zone" data-name="右发髻" cx="278" cy="95" r="28"/>' +
    '<circle class="zone" data-name="左发髻心" cx="122" cy="95" r="14"/>' +
    '<circle class="zone" data-name="右发髻心" cx="278" cy="95" r="14"/>' +
    // 刘海
    '<path class="zone" data-name="刘海" d="M122,145 Q110,60 200,56 Q290,60 278,145 Q252,112 200,114 Q148,112 122,145 Z"/>' +
    // 耳朵
    '<ellipse class="zone" data-name="左耳" cx="120" cy="170" rx="10" ry="14"/>' +
    '<ellipse class="zone" data-name="右耳" cx="280" cy="170" rx="10" ry="14"/>' +
    // 腮红
    '<ellipse class="zone" data-name="左腮红" cx="156" cy="186" rx="18" ry="11"/>' +
    '<ellipse class="zone" data-name="右腮红" cx="244" cy="186" rx="18" ry="11"/>' +
    // === 眉眼嘴（不可填色线描） ===
    '<path class="line" d="M162,152 Q174,144 186,152" stroke-linecap="round"/>' +
    '<path class="line" d="M214,152 Q226,144 238,152" stroke-linecap="round"/>' +
    '<circle class="ink" cx="174" cy="164" r="4.5"/>' +
    '<circle class="ink" cx="226" cy="164" r="4.5"/>' +
    '<path class="line" d="M178,200 Q200,220 222,200 Q220,208 200,212 Q180,208 178,200 Z"/>' +
    // === 身体 ===
    '<path class="zone" data-name="长袍" d="M128,268 Q200,232 272,268 L302,456 Q200,486 98,456 Z"/>' +
    // 袖子
    '<path class="zone" data-name="左袖" d="M130,272 Q86,320 112,370 Q148,366 158,318 Z"/>' +
    '<path class="zone" data-name="右袖" d="M270,272 Q314,320 288,370 Q252,366 242,318 Z"/>' +
    // 腰带
    '<path class="zone" data-name="腰带" d="M102,320 L298,320 L298,350 L102,350 Z"/>' +
    '<circle class="zone" data-name="腰带扣" cx="200" cy="335" r="10"/>' +
    // 交领
    '<path class="zone" data-name="左领" d="M170,248 L198,320 L212,310 L184,248 Z"/>' +
    '<path class="zone" data-name="右领" d="M230,248 L202,320 L188,310 L216,248 Z"/>' +
    // 靴子
    '<path class="zone" data-name="左靴" d="M150,460 L142,514 Q170,524 194,514 L186,460 Z"/>' +
    '<path class="zone" data-name="右靴" d="M218,460 L208,514 Q234,524 258,514 L250,460 Z"/>' +
    // === 鱼（先定义，在下层） ===
    '<path class="zone" data-name="鱼尾" d="M138,388 L92,354 L100,388 L92,422 Z"/>' +
    '<ellipse class="zone" data-name="鱼身" cx="210" cy="390" rx="78" ry="34"/>' +
    '<path class="zone" data-name="鱼鳍" d="M192,364 Q212,344 234,364 Q214,372 192,364 Z"/>' +
    // 鱼鳞/眼睛（线描）
    '<circle class="ink" cx="258" cy="382" r="4"/>' +
    '<path class="line" d="M240,372 Q236,390 240,408"/>' +
    '<path class="line" d="M214,364 Q208,390 214,416"/>' +
    '<path class="line" d="M186,370 Q180,390 186,410"/>' +
    // === 手（后定义，在上层，覆盖鱼身两侧） ===
    '<circle class="zone" data-name="左手" cx="142" cy="390" r="16"/>' +
    '<circle class="zone" data-name="右手" cx="278" cy="390" r="16"/>' +
  '</svg>';

  G.register('g4', {
    guide: '非遗讲解员',
    title: '绵竹年画 · 福娃填色',
    frag: '年画',
    tagline: '一纸年画，年年如意；粉笺敷彩，非遗新生。',

    mount: function (root, api) {
      root.innerHTML =
        '<div class="game-tip">先在右侧<b>点选颜色</b>，再点击福娃线稿的区域上色。<b>全部填完</b>才能获得碎片。</div>' +
        '<div class="color-wrap">' +
          '<div class="color-stage">' + SVG + '</div>' +
          '<div class="palette">' +
            '<div class="swatch-grid"></div>' +
            '<div class="color-status">已上色 <b class="cnt">0</b>/<b class="total">0</b></div>' +
            '<button class="btn btn-ghost btn-sm highlight" type="button">找出未涂区域</button>' +
            '<button class="btn btn-ghost btn-sm reset" type="button">重新填色</button>' +
          '</div>' +
        '</div>';

      var grid = root.querySelector('.swatch-grid');
      var current = COLORS[0];
      var won = false;
      var NEED = root.querySelectorAll('.zone').length;
      root.querySelector('.total').textContent = NEED;
      root.querySelector('.color-status').innerHTML = '已上色 <b class="cnt">0</b>/<b class="total">' + NEED + '</b>';

      COLORS.forEach(function (c, i) {
        var s = G.el('button', 'swatch' + (i === 0 ? ' active' : ''));
        s.style.background = c;
        s.title = c === '#ffffff' ? '白色（可覆盖修改）' : c;
        s.addEventListener('click', function () {
          current = c;
          grid.querySelectorAll('.swatch').forEach(function (x) { x.classList.remove('active'); });
          s.classList.add('active');
        });
        grid.appendChild(s);
      });

      function refresh() {
        var n = root.querySelectorAll('.zone[data-filled="1"]').length;
        var st = root.querySelector('.color-status');
        if (n < NEED) {
          st.innerHTML = '已上色 <b class="cnt">' + n + '</b>/<b class="total">' + NEED + '</b>（还差 ' + (NEED - n) + ' 处）';
        } else {
          st.innerHTML = '<span style="color:#3f7d5b;font-weight:800">✓ 全部完成！福娃喜气洋洋！</span>';
        }
        if (n >= NEED && !won) {
          won = true;
          setTimeout(function () { api.win(); }, 600);
        }
      }

      root.querySelectorAll('.zone').forEach(function (z) {
        z.addEventListener('click', function () {
          z.style.fill = current;
          z.setAttribute('data-filled', '1');
          refresh();
        });
      });

      root.querySelector('.reset').addEventListener('click', function () {
        root.querySelectorAll('.zone').forEach(function (z) {
          z.style.fill = '';
          z.removeAttribute('data-filled');
        });
        won = false;
        refresh();
      });

      root.querySelector('.highlight').addEventListener('click', function () {
        var zones = root.querySelectorAll('.zone');
        zones.forEach(function (z) {
          if (z.getAttribute('data-filled') !== '1') {
            z.style.outline = '4px solid #d43a2f';
            z.style.outlineOffset = '-2px';
            z.style.animation = 'none';
            z.offsetHeight; // 触发 reflow
            z.style.animation = 'zonePulse .8s ease-in-out infinite alternate';
            z.style.cursor = 'pointer';
          }
        });
        setTimeout(function () {
          zones.forEach(function (z) {
            z.style.outline = '';
            z.style.animation = '';
          });
        }, 3000);
      });
    }
  });
})();
