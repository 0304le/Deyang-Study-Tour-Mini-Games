/* 游戏2：红色讲解员 —— 逐条揭线索，识多位德阳英雄 */
(function () {
  'use strict';

  var HEROES = [
    {
      name: '黄继光',
      clues: [
        '他1931年生于四川中江（今德阳中江），家境贫寒，幼年丧父。',
        '1951年参军赴朝，是中国人民志愿军第15军45师135团2营通讯员。',
        '1952年10月上甘岭战役中，他所在营奉命夺取高地，连续爆破后弹药耗尽。',
        '关键时刻他拖着伤躯扑向敌人地堡，用胸膛堵住机枪射孔，壮烈牺牲，年仅21岁。',
        '志愿军总部追记特等功、追授"特级英雄"称号，生前连队被命名为"黄继光连"。'
      ],
      opts: ['黄继光', '邱少云', '董存瑞', '杨根思']
    },
    {
      name: '杨锐',
      clues: [
        '他是晚清维新派代表人物，1855年生于四川绵竹（今德阳绵竹）。',
        '光绪年间入京为官，与刘光第、林旭、杨深秀等人同在军机处任职。',
        '1898年戊戌变法期间，他受光绪帝密诏，参与新政推行。',
        '慈禧发动政变后，他与谭嗣同等六人被捕，不屈就义，史称"戊戌六君子"。',
        '绵竹今有杨锐祠堂与铜像，纪念这位以死殉国的维新志士。'
      ],
      opts: ['杨锐', '刘光第', '谭嗣同', '康有为']
    },
    {
      name: '张栻',
      clues: [
        '他是南宋著名理学家，1133年生于四川绵竹（今德阳绵竹），字敬夫，号南轩。',
        '其父张浚为南宋抗金名相，他自幼受家学熏陶，后师从胡宏学习理学。',
        '他主持岳麓书院，与朱熹在"朱张会讲"中论学三月，传为理学佳话。',
        '他与朱熹、吕祖谦并称"东南三贤"，主张"明体适用"，学以致用。',
        '绵竹南轩书院至今仍存其遗迹，是德阳重要的历史文化名人。'
      ],
      opts: ['张栻', '朱熹', '陆九渊', '程颢']
    }
  ];

  G.register('g2', {
    guide: '红色讲解员',
    title: '揭线索 · 识英雄',
    frag: '忠魂',
    tagline: '铁血担当，英雄不朽；最可爱的人，魂铸中江。',

    mount: function (root, api) {
      var heroIdx = 0;
      var revealedCount = 0;
      var guessed = false; // 是否猜错等待揭线索

      function buildHero() {
        var hero = HEROES[heroIdx];
        revealedCount = 0;
        guessed = false;

        root.innerHTML =
          '<div class="game-tip">逐条揭开线索，判断这位德阳英雄是谁。<b>越少线索猜中越厉害</b>——猜错需再揭一条线索才能重试。</div>' +
          '<div class="hero-stage">' +
            '<div class="hero-progress">' +
              '<span>第 ' + (heroIdx + 1) + ' / ' + HEROES.length + ' 位</span>' +
              HEROES.map(function (_, i) {
                return '<span class="hero-dot' + (i < heroIdx ? ' done' : '') + (i === heroIdx ? ' active' : '') + '"></span>';
              }).join('') +
            '</div>' +
            '<div class="hero-clues">' +
              hero.clues.map(function (c, i) {
                return '<div class="hero-clue" data-i="' + i + '">' +
                  '<button class="clue-cover" type="button">' +
                    '<span class="clue-num">' + (i + 1) + '</span>' +
                    '<span class="clue-label">点击揭开</span>' +
                  '</button>' +
                  '<p class="clue-text">' + c + '</p>' +
                '</div>';
              }).join('') +
            '</div>' +
            '<div class="hero-guess">' +
              '<div class="guess-meta">已揭 <b class="rev-cnt">0</b> / ' + hero.clues.length + ' 条线索</div>' +
              '<div class="guess-prompt">' + (revealedCount > 0 ? '' : '至少揭开 1 条线索后可猜') + '</div>' +
              '<div class="guess-opts">' +
                G.shuffle(hero.opts).map(function (o) {
                  return '<button class="guess-btn" data-v="' + (o === hero.name ? 'ok' : 'x') + '" type="button" disabled>' + o + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>';

        var stage = root.querySelector('.hero-stage');

        // 揭线索
        stage.querySelectorAll('.clue-cover').forEach(function (cover) {
          cover.addEventListener('click', function () {
            var card = cover.parentElement;
            if (card.classList.contains('flipped')) return;
            card.classList.add('flipped');
            revealedCount++;
            stage.querySelector('.rev-cnt').textContent = revealedCount;

            var prompt = stage.querySelector('.guess-prompt');
            var btns = stage.querySelectorAll('.guess-btn');

            if (guessed) {
              // 猜错过，揭开新线索后重新激活（排除已标 wrong 的）
              guessed = false;
              prompt.textContent = '再来猜一次！';
              btns.forEach(function (b) {
                if (!b.classList.contains('wrong')) b.disabled = false;
              });
            } else {
              if (revealedCount >= 1) {
                prompt.textContent = '可以猜了，也可以继续揭线索';
                btns.forEach(function (b) {
                  if (!b.classList.contains('wrong')) b.disabled = false;
                });
              }
              if (revealedCount >= hero.clues.length) {
                prompt.textContent = '线索已全部揭开，快猜吧！';
              }
            }
          });
        });

        // 猜
        stage.querySelectorAll('.guess-btn').forEach(function (b) {
          b.addEventListener('click', function () {
            if (b.disabled) return;
            if (b.dataset.v === 'ok') {
              b.style.background = 'var(--jade)';
              b.style.color = '#fff';
              b.textContent = b.textContent + ' ✓';
              stage.querySelectorAll('.guess-btn').forEach(function (bb) { bb.disabled = true; });

              if (heroIdx < HEROES.length - 1) {
                stage.querySelector('.guess-prompt').innerHTML = '<b style="color:var(--jade)">猜对了！下一位英雄……</b>';
                setTimeout(function () {
                  heroIdx++;
                  buildHero();
                }, 1200);
              } else {
                stage.querySelector('.guess-prompt').innerHTML = '<b style="color:var(--jade)">全部英雄确证！</b>';
                setTimeout(function () { api.win(); }, 1000);
              }
            } else {
              b.classList.add('wrong');
              b.disabled = true;
              guessed = true;
              // 禁用其他按钮，等揭开新线索
              stage.querySelectorAll('.guess-btn').forEach(function (bb) { bb.disabled = true; });
              var remaining = hero.clues.length - revealedCount;
              if (remaining > 0) {
                stage.querySelector('.guess-prompt').textContent = '猜错了！再揭开一条线索才能重试。';
                api.toast('不对哦，再揭开一条线索试试');
              } else {
                // 线索已全揭完，给最后一次机会
                setTimeout(function () {
                  guessed = false;
                  stage.querySelector('.guess-prompt').textContent = '再猜一次！';
                  stage.querySelectorAll('.guess-btn').forEach(function (bb) {
                    if (!bb.classList.contains('wrong')) bb.disabled = false;
                  });
                }, 800);
              }
            }
          });
        });
      }

      buildHero();
    }
  });
})();
