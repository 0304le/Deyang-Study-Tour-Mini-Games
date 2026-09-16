/* 游戏1：历史讲解员 —— 德阳三景九块拼图（多轮） */
(function () {
  'use strict';

  var PUZZLES = [
    { img: G.IMG('四川德阳白马关古蜀道关隘古战场，三国风格城墙关楼旌旗，远山苍茫，国风写实历史插画，方形构图，细节丰富', 'square_hd'),
      name: '白马关古战场' },
    { img: G.IMG('四川德阳文庙大成殿全景，红墙黄瓦古建筑群，棂星门泮池，古柏参天，国风写实建筑插画，方形构图', 'square_hd'),
      name: '德阳文庙' },
    { img: G.IMG('三星堆青铜面具特写，神秘夸张纵目面具，金色面罩，古蜀文明祭祀场景，国风写实考古插画，方形构图', 'square_hd'),
      name: '三星堆青铜面具' }
  ];

  var N = 3; // 3×3 = 9 块
  var TOTAL = N * N;

  function bgPos(row, col) {
    var x = N === 1 ? 0 : (col / (N - 1)) * 100;
    var y = N === 1 ? 0 : (row / (N - 1)) * 100;
    return x + '% ' + y + '%';
  }

  var PIECES = [];
  for (var r = 0; r < N; r++) {
    for (var c = 0; c < N; c++) {
      PIECES.push({ idx: r * N + c, row: r, col: c, pos: bgPos(r, c) });
    }
  }

  G.register('g1', {
    guide: '历史讲解员',
    title: '白马关 · 图片碎片拼图',
    frag: '古蜀',
    tagline: '白马关中，鼓角远去；古蜀雄关，风骨长存。',

    mount: function (root, api) {
      var stageIdx = 0;
      var ghost = null, dragPiece = null, size = 80;

      function buildStage() {
        var puz = PUZZLES[stageIdx];
        root.innerHTML =
          '<div class="game-tip">将下方 <b>9 块碎片</b>拖到画布对应空缺，复原 <b>' + puz.name + '</b>。</div>' +
          '<div class="puz-progress"><span>第 ' + (stageIdx + 1) + ' / ' + PUZZLES.length + ' 幅</span>' +
            PUZZLES.map(function (_, i) {
              return '<span class="puz-dot' + (i < stageIdx ? ' done' : '') + (i === stageIdx ? ' active' : '') + '"></span>';
            }).join('') +
          '</div>' +
          '<div class="puz-wrap">' +
            '<div class="puz-board"></div>' +
            '<div class="puz-status">已归位 <span class="cnt">0</span> / ' + TOTAL + '</div>' +
            '<div class="puz-tray"></div>' +
          '</div>';

        var board = root.querySelector('.puz-board');
        var tray = root.querySelector('.puz-tray');
        var cnt = root.querySelector('.cnt');

        for (var i = 0; i < TOTAL; i++) {
          var slot = G.el('div', 'puz-slot');
          slot.dataset.i = i;
          board.appendChild(slot);
        }

        function makePiece(p) {
          var el = G.el('div', 'puz-piece');
          el.dataset.i = p.idx;
          // 预加载图片，失败时使用渐变占位
          (function attachImage(element, src) {
            try {
              var loader = new Image();
              // 允许跨域加载（如果图床支持）以避免 tainted canvas 问题
              loader.crossOrigin = 'anonymous';
              loader.onload = function () {
                element.style.backgroundImage = 'url("' + loader.src + '")';
                element.style.backgroundPosition = p.pos;
                element.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';
              };
              loader.onerror = function () {
                console.warn('Puzzle image failed to load:', src);
                // 回退占位样式，保持背景位置/size 以免布局跳动
                element.style.backgroundImage = 'linear-gradient(135deg,#e7dcbf,#d7c8a2)';
                element.style.backgroundPosition = p.pos;
                element.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';
              };
              loader.src = src;
            } catch (e) {
              console.warn('Image load error', e);
              element.style.backgroundImage = 'linear-gradient(135deg,#e7dcbf,#d7c8a2)';
              element.style.backgroundPosition = p.pos;
              element.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';
            }
          })(el, puz.img);

          // 预先设置 position/size（防止样式被覆盖）
          el.style.backgroundPosition = p.pos;
          el.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';

          el.addEventListener('pointerdown', startDrag);
          return el;
        }

        G.shuffle(PIECES).forEach(function (p) {
          tray.appendChild(makePiece(p));
        });

        function afterPlace() {
          var n = board.querySelectorAll('.puz-piece').length;
          cnt.textContent = n;
          if (n === TOTAL) {
            root.querySelector('.puz-status').innerHTML = '「' + puz.name + '」画面完整复原！';
            if (stageIdx < PUZZLES.length - 1) {
              setTimeout(function () {
                stageIdx++;
                buildStage();
              }, 1200);
            } else {
              setTimeout(function () { api.win(); }, 800);
            }
          }
        }

        /* 拖拽逻辑 */
        function startDrag(e) {
          if (e.currentTarget.classList.contains('locked')) return;
          dragPiece = e.currentTarget;
          e.preventDefault();
          size = dragPiece.getBoundingClientRect().width;
          ghost = G.el('div', 'puz-ghost');
          ghost.style.width = size + 'px';
          ghost.style.height = size + 'px';
          // 复制当前碎片的背景（可能是图片或占位）
          ghost.style.backgroundImage = dragPiece.style.backgroundImage;
          ghost.style.backgroundPosition = dragPiece.style.backgroundPosition;
          ghost.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';
          document.body.appendChild(ghost);
          moveGhost(e.clientX, e.clientY);
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp, { once: true });
        }

        function moveGhost(x, y) {
          ghost.style.left = (x - size / 2) + 'px';
          ghost.style.top = (y - size / 2) + 'px';
        }

        function onMove(e) { moveGhost(e.clientX, e.clientY); }

        function onUp(e) {
          window.removeEventListener('pointermove', onMove);
          if (ghost) { ghost.remove(); ghost = null; }
          var target = document.elementFromPoint(e.clientX, e.clientY);
          var slot = target && target.closest ? target.closest('.puz-slot') : null;
          if (slot && !slot.children.length &&
              Number(slot.dataset.i) === Number(dragPiece.dataset.i)) {
            slot.appendChild(dragPiece);
            dragPiece.classList.add('locked');
            slot.classList.add('correct');
            afterPlace();
          }
          dragPiece = null;
        }
      }

      buildStage();
    }
  });
})();
