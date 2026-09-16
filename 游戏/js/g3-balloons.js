/* 游戏3：文物讲解员 —— 点击爆破文物气球（重制版）
   玩法：气球从下方升起，3 个德阳文物目标 + 多个干扰项
   机制：点对加分+连击，点错扣分，气球飘走扣分/扣时，限时内达成得分线过关
*/
(function () {
  'use strict';

  var TARGETS = ['庞统祠', '绵竹汉画像砖', '三星堆青铜面具', '德阳文庙', '罗江白马关'];
  var DISTRACTORS = ['金沙太阳神鸟', '成都武侯祠', '杜甫草堂', '宝墩古城玉器', '青城山道教造像', '乐山石刻大佛', '雅安汉阙', '自贡恐龙化石', '宜宾竹簧工艺', '泸州老窖窖池'];
  var COLORS = ['#c84034', '#d98a34', '#3f7d5b', '#3d6e9e', '#8a4a8f', '#c0562f', '#2f8f86', '#a33d5b', '#6e7a3f', '#9e6b2f'];
  var RELICS = ['🏛', '🪨', '🎭', '🦅', '🐉', '📜', '💎', '⛰', '🦴', '🏺'];

  var TOTAL_TARGETS = 5;
  var NEEDED_SCORE = 500;   // 过关分数线
  var TIME_LIMIT = 50;      // 秒
  var MAX_ESCAPE = 4;       // 漏网上限

  G.register('g3', {
    guide: '文物讲解员',
    title: '爆破气球 · 识德阳文物',
    frag: '石镌',
    tagline: '砖石无言，文物有声；一祠一砖，镌刻德阳。',

    mount: function (root, api) {
      root.innerHTML =
        '<div class="game-tip">气球带着各地文物从下方升起。任务：在 <b>' + TIME_LIMIT + '秒</b> 内，点破 <b>' + TOTAL_TARGETS + ' 枚德阳文物气球</b>（' + TARGETS.join('、') + '），累计得分 ≥ ' + NEEDED_SCORE + ' 即可通关。<br>' +
        '点错扣分、气球飘走扣分扣时，<b>漏网 ' + MAX_ESCAPE + ' 只</b> 直接判定失败！</div>' +
        '<div class="sky-hud">' +
          '<span class="hud-item">⏱ <b class="hud-time">' + TIME_LIMIT + '</b>s</span>' +
          '<span class="hud-item">🎯 <b class="hud-target">0</b>/' + TOTAL_TARGETS + '</span>' +
          '<span class="hud-item">💯 <b class="hud-score">0</b>/' + NEEDED_SCORE + '</span>' +
          '<span class="hud-item">🔥 连击 <b class="hud-combo">0</b></span>' +
          '<span class="hud-item">💨 漏网 <b class="hud-escape">0</b>/' + MAX_ESCAPE + '</span>' +
        '</div>' +
        '<div class="sky-stage" style="cursor:url(\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22><circle cx=%2216%22 cy=%2216%22 r=%2212%22 fill=%22none%22 stroke=%22%23c84034%22 stroke-width=%222%22/><circle cx=%2216%22 cy=%2216%22 r=%222%22 fill=%22%23c84034%22/></svg>\') 16 16, crosshair;">' +
          '<div class="sky-ground"></div>' +
          '<div class="sky-cloud c1"></div><div class="sky-cloud c2"></div><div class="sky-cloud c3"></div>' +
        '</div>' +
        '<div class="sky-legend">' +
          '<span class="legend-title">德阳文物目标：</span>' +
          TARGETS.map(function (t) {
            return '<span class="legend-chip" data-name="' + t + '">' + t + '</span>';
          }).join('') +
        '</div>';

      var stage = root.querySelector('.sky-stage');
      var hudTime = root.querySelector('.hud-time');
      var hudTarget = root.querySelector('.hud-target');
      var hudScore = root.querySelector('.hud-score');
      var hudCombo = root.querySelector('.hud-combo');
      var hudEscape = root.querySelector('.hud-escape');

      var targetsPopped = 0;
      var score = 0;
      var combo = 0;
      var escapes = 0;
      var timeLeft = TIME_LIMIT;
      var finished = false;
      var spawnTimer = null;
      var tickTimer = null;
      var balloons = [];

      // ---- HUD 更新 ----
      function updateHUD() {
        hudTime.textContent = timeLeft;
        hudTarget.textContent = targetsPopped;
        hudScore.textContent = score;
        hudCombo.textContent = combo;
        hudEscape.textContent = escapes;
        // 时间紧张变红
        hudTime.style.color = timeLeft <= 10 ? '#c84034' : '';
        hudEscape.style.color = escapes >= 2 ? '#c84034' : '';
      }

      // ---- 生成气球（目标池会自动补充飘走的） ----
      var targetPool = TARGETS.slice();
      var distractorPool = DISTRACTORS.slice();

      function ensureTargetPool() {
        // 飘走的目标名字要回流，保证永远有目标可出
        if (targetPool.length < 2) {
          TARGETS.forEach(function (t) {
            if (targetPool.indexOf(t) === -1) targetPool.push(t);
          });
        }
      }

      function spawnBalloon() {
        if (finished) return;
        ensureTargetPool();
        // 只要还有目标没点完，就高概率出目标
        var needMoreTargets = targetsPopped + balloonCategoryCount('target') < TOTAL_TARGETS;
        var isTarget = needMoreTargets ? Math.random() < 0.6 : Math.random() < 0.35;

        var name, isRelic;
        if (isTarget && targetPool.length) {
          var idx = Math.floor(Math.random() * targetPool.length);
          name = targetPool.splice(idx, 1)[0];
          isRelic = true;
        } else if (distractorPool.length) {
          var idx2 = Math.floor(Math.random() * distractorPool.length);
          name = distractorPool.splice(idx2, 1)[0];
          isRelic = false;
        } else if (targetPool.length) {
          // 干扰项用完了，但目标还有
          var idx3 = Math.floor(Math.random() * targetPool.length);
          name = targetPool.splice(idx3, 1)[0];
          isRelic = true;
        } else {
          return;
        }

        var color = COLORS[Math.floor(Math.random() * COLORS.length)];
        var icon = RELICS[Math.floor(Math.random() * RELICS.length)];
        var size = 90 + Math.random() * 50; // 90-140px
        var left = 3 + Math.random() * 80; // 3%-83%
        var riseDur = 6 + Math.random() * 4; // 6-10s 升到顶
        var swayDur = 2 + Math.random() * 1.5;

        var ball = G.el('div', 'balloon');
        ball.style.cssText =
          'left:' + left + '%;' +
          'bottom:-160px;' +
          'width:' + size + 'px;' +
          '--rise:' + riseDur + 's;' +
          '--sway:' + swayDur + 's;' +
          'pointer-events:auto;';
        ball.dataset.name = name;
        ball.dataset.target = isRelic ? '1' : '0';
        ball.innerHTML =
          '<div class="b-body" style="--bc:' + color + '">' +
            '<span class="b-icon">' + icon + '</span>' +
            '<span class="b-label"><span class="b-name">' + name + '</span></span>' +
          '</div>' +
          '<div class="b-knot"></div>' +
          '<div class="b-string"></div>';

        ball.addEventListener('animationend', function () {
          if (ball.classList.contains('popped') || finished) return;
          // 飘走了 — 目标放回池里
          escapes++;
          combo = 0;
          score = Math.max(0, score - 30);
          if (ball.dataset.target === '1') {
            var escapedName = ball.dataset.name;
            if (targetPool.indexOf(escapedName) === -1) targetPool.push(escapedName);
          }
          api.toast('飘走了！-30 分');
          updateHUD();
          ball.remove();
          balloons = balloons.filter(function (b) { return b !== ball; });
          if (escapes >= MAX_ESCAPE && !finished) endGame(false, MAX_ESCAPE + ' 只气球漏网！');
        });

        ball.addEventListener('click', function () {
          if (ball.classList.contains('popped') || finished) return;
          ball.classList.add('popped');
          clearTimeout(ball._riseTimer);

          if (isRelic) {
            targetsPopped++;
            combo++;
            var base = 150;
            var comboBonus = Math.min(combo - 1, 5) * 20;
            var gain = base + comboBonus;
            score += gain;
            api.toast('✓ 德阳文物！+' + gain + (combo > 1 ? ' 连击×' + combo : ''));
            // 目标图例高亮
            var chip = root.querySelector('.legend-chip[data-name="' + name + '"]');
            if (chip) chip.classList.add('got');
            if (targetsPopped >= TOTAL_TARGETS) endGame(true, TOTAL_TARGETS + ' 枚德阳文物全部爆破！');
          } else {
            combo = 0;
            score = Math.max(0, score - 50);
            api.toast('✗ 点错了！-50 分');
          }

          // 爆破特效
          createPopFx(ball, isRelic);
          setTimeout(function () { ball.remove(); }, 300);
          balloons = balloons.filter(function (b) { return b !== ball; });
          updateHUD();
        });

        stage.appendChild(ball);
        balloons.push(ball);
      }

      function balloonCategoryCount(cat) {
        var n = 0;
        balloons.forEach(function (b) {
          if (b.dataset.target === (cat === 'target' ? '1' : '0')) n++;
        });
        return n;
      }

      function createPopFx(ball, good) {
        var rect = ball.getBoundingClientRect();
        var stageRect = stage.getBoundingClientRect();
        var cx = rect.left - stageRect.left + rect.width / 2;
        var cy = rect.top - stageRect.top + rect.height / 2;
        var color = ball.querySelector('.b-body').style.getPropertyValue('--bc') || '#c84034';
        var fx = G.el('div', 'pop-fx');
        fx.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;';

        // 1. 空气冲击波
        fx.appendChild(G.el('div', 'pop-burst'));

        // 2. 粒子碎屑（8 片，向随机方向飞）
        for (var i = 0; i < 8; i++) {
          var shard = G.el('div', 'pop-shard');
          var angle = (Math.PI * 2 * i / 8) + (Math.random() - 0.5) * 0.6;
          var dist = 40 + Math.random() * 50;
          shard.style.cssText =
            'background:' + color + ';' +
            '--dx:' + Math.cos(angle) * dist + 'px;' +
            '--dy:' + Math.sin(angle) * dist + 'px;' +
            '--rot:' + (Math.random() * 540 - 270) + 'deg;' +
            'animation-delay:' + (Math.random() * 0.04) + 's;';
          fx.appendChild(shard);
        }

        // 3. 扩散圆环
        var ring = G.el('div', 'pop-ring ' + (good ? 'good' : 'bad'));
        fx.appendChild(ring);

        // 4. 分数标签
        var gain = 150 + Math.min(combo - 1, 5) * 20;
        var label = G.el('div', 'pop-label ' + (good ? 'good' : 'bad'),
          good ? '+' + gain + (combo > 1 ? '  ×' + combo : '') : '-50');
        fx.appendChild(label);

        stage.appendChild(fx);
        setTimeout(function () { fx.remove(); }, 700);
      }

      // ---- 倒计时 ----
      function tick() {
        if (finished) return;
        timeLeft--;
        updateHUD();
        if (timeLeft <= 0) endGame(score >= NEEDED_SCORE, '时间到！');
      }

      function endGame(success, reason) {
        finished = true;
        clearInterval(spawnTimer);
        clearInterval(tickTimer);
        // 停掉所有上升动画
        balloons.forEach(function (b) {
          if (!b.classList.contains('popped')) {
            b.style.animationPlayState = 'paused';
          }
        });

        if (success && score >= NEEDED_SCORE) {
          setTimeout(function () { api.win(); }, 500);
        } else {
          // 失败面板
          var fail = G.el('div', 'cook-fail');
          fail.innerHTML =
            '<h3>挑战失败</h3>' +
            '<p>' + reason + ' 最终得分：<b>' + score + '</b> / ' + NEEDED_SCORE + '</p>' +
            '<button class="btn" type="button">再试一次</button>';
          fail.querySelector('button').addEventListener('click', function () {
            fail.remove();
            // 重新初始化
            balloons.forEach(function (b) { b.remove(); });
            balloons = [];
            targetPool = TARGETS.slice();
            distractorPool = DISTRACTORS.slice();
            targetsPopped = 0; score = 0; combo = 0; escapes = 0; timeLeft = TIME_LIMIT;
            finished = false;
            // 恢复图例
            root.querySelectorAll('.legend-chip').forEach(function (c) { c.classList.remove('got'); });
            startRound();
          });
          stage.appendChild(fail);
        }
      }

      function startRound() {
        updateHUD();
        tickTimer = setInterval(tick, 1000);
        // 先 3 只气球热身
        for (var i = 0; i < 3; i++) setTimeout(spawnBalloon, i * 500);
        // 持续生成：间隔逐渐缩短
        spawnTimer = setInterval(function () {
          if (balloons.length < 6) spawnBalloon();
        }, 1400);
      }
      startRound();

      // 提亮色
      function shade(hex) {
        var n = parseInt(hex.slice(1), 16);
        var r = Math.min(255, (n >> 16) + 70);
        var g = Math.min(255, ((n >> 8) & 255) + 70);
        var bl = Math.min(255, (n & 255) + 70);
        return 'rgb(' + r + ',' + g + ',' + bl + ')';
      }
    }
  });
})();
