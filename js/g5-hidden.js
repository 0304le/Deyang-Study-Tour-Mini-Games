/* 游戏5：自然讲解员 —— 龙门山全景图点击寻物（三轮九种生灵） */
(function () {
  'use strict';

  // 图片已下载为本地静态文件（assets/img/），不依赖在线生图接口
  // 三轮不同生态场景，每轮 3 个目标；目标坐标与画面内容对应
  var ROUNDS = [
    {
      name: '第一景 · 龙门山林海',
      img: 'assets/img/g5-1-linhai.jpg',
      targets: [
        { key: 'gongtong', name: '珙桐（鸽子花）', x: 15, y: 58 },
        { key: 'jinji', name: '红腹锦鸡', x: 82, y: 60 },
        { key: 'juelei', name: '蕨类植物', x: 47, y: 86 }
      ]
    },
    {
      name: '第二景 · 山涧溪谷',
      img: 'assets/img/g5-2-xigu.jpg',
      targets: [
        { key: 'dani', name: '大鲵（娃娃鱼）', x: 20, y: 82 },
        { key: 'bailu', name: '白鹭', x: 78, y: 62 },
        { key: 'suoluo', name: '桫椤树', x: 30, y: 40 }
      ]
    },
    {
      name: '第三景 · 高山花海',
      img: 'assets/img/g5-3-huahai.jpg',
      targets: [
        { key: 'xiaoxiongmao', name: '小熊猫', x: 22, y: 62 },
        { key: 'hongzhi', name: '绿尾虹雉', x: 78, y: 58 },
        { key: 'dujuan', name: '高山杜鹃', x: 50, y: 86 }
      ]
    }
  ];

  G.register('g5', {
    guide: '自然讲解员',
    title: '龙门山 · 全景寻物探秘',
    frag: '翠山',
    tagline: '珍禽奇木，自在龙门；翠岭生灵，皆是馈赠。',

    mount: function (root, api) {
      var roundIdx = 0;
      var won = false;

      function renderRound() {
        var rd = ROUNDS[roundIdx];
        root.innerHTML =
          '<div class="game-tip">移动鼠标在全景图中搜寻，<b>靠近目标时会出现虚线圈提示</b>，点击即可发现。' +
          '本轮找出：<b>' + rd.targets.map(function (t) { return t.name; }).join('、') + '</b>。</div>' +
          '<div class="hunt-progress">' +
            ROUNDS.map(function (r, i) {
              return '<span class="hunt-dot' + (i < roundIdx ? ' done' : (i === roundIdx ? ' current' : '')) + '">' +
                (i < roundIdx ? '✓ ' : '') + r.name + '</span>';
            }).join('<i class="hunt-arrow">→</i>') +
          '</div>' +
          '<div class="hunt-stage">' +
            '<img src="' + G.cdn(rd.img) + '" data-fb="' + rd.img + '" alt="' + rd.name + '" draggable="false" ' +
              'onerror="this.onerror=null;if(this.dataset.fb){this.src=this.dataset.fb;}">' +
          '</div>' +
          '<div class="hunt-list">' +
            rd.targets.map(function (t) {
              return '<span class="hunt-item" data-key="' + t.key + '">◯ ' + t.name + '</span>';
            }).join('') +
          '</div>';

        var stage = root.querySelector('.hunt-stage');
        var found = {};
        var missHinted = false;

        rd.targets.forEach(function (t) {
          var spot = G.el('button', 'hunt-spot');
          spot.style.left = t.x + '%';
          spot.style.top = t.y + '%';
          spot.innerHTML = '<span class="hint-ring"></span>';
          spot.addEventListener('click', function (e) {
            e.stopPropagation();
            if (found[t.key]) return;
            found[t.key] = true;
            spot.classList.add('found');
            spot.innerHTML = '<span class="found-mark">✓</span>';
            var item = root.querySelector('.hunt-item[data-key="' + t.key + '"]');
            item.classList.add('found');
            item.textContent = '✓ ' + t.name;
            api.toast('发现了：' + t.name);
            if (rd.targets.every(function (x) { return found[x.key]; })) {
              if (roundIdx < ROUNDS.length - 1) {
                api.toast('本景搜寻完毕，前往下一景！');
                roundIdx++;
                setTimeout(renderRound, 1100);
              } else if (!won) {
                won = true;
                setTimeout(function () { api.win(); }, 700);
              }
            }
          });
          stage.appendChild(spot);
        });

        // 靠近提示
        stage.addEventListener('mousemove', function (e) {
          var r = stage.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width * 100;
          var py = (e.clientY - r.top) / r.width * 100;
          var any = false;
          stage.querySelectorAll('.hunt-spot').forEach(function (s, i) {
            var t = rd.targets[i];
            if (found[t.key]) return;
            var near = Math.hypot(px - t.x, py - t.y) < 11;
            s.classList.toggle('near', near);
            if (near) any = true;
          });
          stage.classList.toggle('hinting', any);
        });
        stage.addEventListener('mouseleave', function () {
          stage.classList.remove('hinting');
          stage.querySelectorAll('.hunt-spot').forEach(function (s) { s.classList.remove('near'); });
        });

        // 点空涟漪
        stage.addEventListener('click', function (e) {
          if (e.target !== stage && e.target.tagName !== 'IMG') return;
          var r = stage.getBoundingClientRect();
          var rip = G.el('span', 'hunt-ripple');
          rip.style.left = (e.clientX - r.left) + 'px';
          rip.style.top = (e.clientY - r.top) + 'px';
          stage.appendChild(rip);
          setTimeout(function () { rip.remove(); }, 600);
          if (!missHinted) {
            missHinted = true;
            api.toast('这里没有发现，靠近目标时会有虚线圈');
          }
        });
      }

      renderRound();
    }
  });
})();
