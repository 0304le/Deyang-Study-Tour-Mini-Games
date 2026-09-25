/* 游戏9：饮食文化讲解员 —— 连山回锅肉三阶段十二步投料 */
(function () {
  'use strict';

  // 图片已下载为本地静态文件（assets/img/），不依赖在线生图接口
  var DISH = 'assets/img/g9-dish.jpg';

  // 三阶段、十二步正确投料顺序；phase 标识所属阶段
  var STEPS = [
    { name: '带皮二刀肉', phase: 0, tip: '整块二刀肉冷水下锅，水要没过肉' },
    { name: '生姜', phase: 0, tip: '投入拍松的姜块，去腥提鲜' },
    { name: '花椒', phase: 0, tip: '一小撮花椒同煮，川味肉香的底子' },
    { name: '料酒', phase: 0, tip: '淋入料酒，煮至七成熟即可捞起' },
    { name: '熟肉片', phase: 1, tip: '肉块晾凉，切一分厚的大片，下锅熬至卷曲成灯盏窝' },
    { name: '食用油', phase: 1, tip: '肉片熬出油后，若油不够再补少许菜籽油' },
    { name: '郫县豆瓣', phase: 1, tip: '小火剁细的豆瓣炒出红油，此是回锅肉的灵魂' },
    { name: '甜面酱', phase: 1, tip: '一勺甜面酱增香回甜，炒匀上色' },
    { name: '豆豉', phase: 1, tip: '加入永川豆豉，酱香更醇厚' },
    { name: '青蒜苗', phase: 2, tip: '临熟下青蒜苗段，断生即可，久炒则蔫' },
    { name: '食盐', phase: 2, tip: '豆瓣豆豉皆咸，只需少许盐定味' },
    { name: '白糖', phase: 2, tip: '最后一点白糖和味提鲜，立刻起锅' }
  ];

  // 干扰食材（任何时候点都算错）
  var TRAPS = ['陈醋', '八角', '干辣椒', '土豆', '青椒'];

  var PHASE_NAMES = ['一、冷水煮肉 · 去腥定型', '二、切大片 · 熬炒红油', '三、临熟投料 · 起锅装盘'];

  G.register('g9', {
    guide: '饮食文化讲解员',
    title: '灶台投料 · 连山回锅肉',
    frag: '蜀味',
    tagline: '一菜一格，百肉香魂；连山回锅，蜀味人间。',

    mount: function (root, api) {
      var expected, won;

      function start() {
        expected = 0; won = false;
        var all = STEPS.map(function (s) { return { name: s.name, ok: true }; })
          .concat(TRAPS.map(function (n) { return { name: n, ok: false }; }));

        root.innerHTML =
          '<div class="game-tip">连山回锅肉是德阳广汉连山名菜，讲究<b>先煮后炒、投料有序</b>。全程 ' +
          '<b>3 个阶段、12 步投料</b>，按提示依次点击正确食材；点错一步就要从头再来。</div>' +
          '<div class="cook-progress">' +
            PHASE_NAMES.map(function (n, i) {
              return '<span class="cp-dot" data-i="' + i + '"><i>' + ['🍲', '🔥', '🍽'][i] + '</i>' + n + '</span>';
            }).join('<b></b>') +
          '</div>' +
          '<div class="cook-stage phase-0">' +
            '<div class="cook-step">第 1 / 12 步</div>' +
            '<div class="cook-phase"></div>' +
            '<div class="cook-pot">' +
              '<span class="pot-flame"></span>' +
              '<div class="pot-body"></div>' +
              '<div class="pot-rim"></div>' +
              '<div class="pot-food"><img class="pot-dish" src="' + G.cdn(DISH) + '" data-fb="' + DISH + '" alt="回锅肉" ' +
                'onerror="this.onerror=null;if(this.dataset.fb){this.src=this.dataset.fb;}"></div>' +
              '<span class="steam s1"></span><span class="steam s2"></span><span class="steam s3"></span>' +
            '</div>' +
            '<div class="cook-added"></div>' +
          '</div>' +
          '<div class="ing-grid"></div>';

        var stage = root.querySelector('.cook-stage');
        var phaseEl = root.querySelector('.cook-phase');
        var stepEl = root.querySelector('.cook-step');
        var added = root.querySelector('.cook-added');
        var grid = root.querySelector('.ing-grid');

        function refreshPhaseDots() {
          root.querySelectorAll('.cp-dot').forEach(function (el) {
            var i = Number(el.dataset.i);
            el.classList.toggle('current', i === STEPS[expected].phase);
            el.classList.toggle('done', i < STEPS[expected].phase);
          });
        }

        phaseEl.textContent = STEPS[0].tip;
        refreshPhaseDots();

        G.shuffle(all).forEach(function (ing) {
          var b = G.el('button', 'ing-btn', ing.name);
          b.type = 'button';
          b.addEventListener('click', function () {
            if (won || b.disabled) return;
            var correct = ing.ok && ing.name === STEPS[expected].name;
            if (correct) {
              b.disabled = true;
              b.classList.add('used');
              added.appendChild(G.el('span', 'cook-chip', ing.name));
              expected++;

              if (expected >= STEPS.length) {
                // 完成
                won = true;
                stepEl.textContent = '12 / 12 步完成';
                phaseEl.textContent = '起锅装盘 · 肥而不腻，灯盏窝形，浓香四溢！';
                stage.className = 'cook-stage done';
                root.querySelectorAll('.cp-dot').forEach(function (el) { el.classList.add('done'); el.classList.remove('current'); });
                setTimeout(function () { api.win(); }, 1000);
                return;
              }

              var next = STEPS[expected];
              stepEl.textContent = '第 ' + (expected + 1) + ' / 12 步';
              phaseEl.textContent = next.tip;
              stage.className = 'cook-stage phase-' + next.phase + ' cooking';
              refreshPhaseDots();
            } else {
              showFail(ing.name);
            }
          });
          grid.appendChild(b);
        });

        function showFail(name) {
          var f = G.el('div', 'cook-fail');
          f.innerHTML =
            '<h3>投料顺序不对！</h3>' +
            '<p>「' + name + '」不该在此时下锅。<br>连山回锅肉：先以二刀肉配姜、花椒、料酒冷水煮透，' +
            '晾凉切大片后熬出灯盏窝，再下郫县豆瓣、甜面酱、豆豉炒红油，临熟投青蒜苗，' +
            '最后以少许盐、糖和味起锅。</p>' +
            '<button class="btn btn-sm" type="button">重新开始</button>';
          f.querySelector('button').addEventListener('click', start);
          stage.appendChild(f);
        }
      }

      start();
    }
  });
})();
