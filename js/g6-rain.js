/* 游戏6：农耕讲解员 —— 三分期雨水管理（随机天气 + 限时保持） */
(function () {
  'use strict';

  // 图片已下载为本地静态文件（assets/img/），不依赖在线生图接口
  var IMG_DRY = 'assets/img/g6-dry.jpg';
  var IMG_OK = 'assets/img/g6-ok.jpg';
  var IMG_BAD = 'assets/img/g6-bad.jpg';
  // CDN 加载失败时自动切回 GitHub 源
  var FB_ERR = 'onerror="this.onerror=null;if(this.dataset.fb){this.src=this.dataset.fb;}"';

  // 水稻三个生长期，需水量各不相同
  var STAGES = [
    { name: '插秧返青期', tip: '秧苗刚插下，需要深水护苗', lo: 62, hi: 84, time: 24 },
    { name: '分蘖晒田期', tip: '够苗后要浅水勤灌、适时晒田，水多会徒长', lo: 22, hi: 44, time: 24 },
    { name: '抽穗灌浆期', tip: '抽穗需湿润稳长，干湿交替最利灌浆', lo: 44, hi: 64, time: 26 }
  ];

  var HOLD_NEED = 2.2; // 在适宜区间内需持续保持的秒数

  G.register('g6', {
    guide: '农耕讲解员',
    title: '农田灌溉 · 三季雨水',
    frag: '嘉禾',
    tagline: '风调雨顺，嘉禾丛生；一粥一饭，仰赖天时。',

    mount: function (root, api) {
      var stageIdx = 0;
      var moisture = 10;
      var hold = 0;
      var timeLeft = STAGES[0].time;
      var running = false;
      var won = false;
      var timer = null, weatherTimer = null;
      var currentWeather = null;

      root.innerHTML =
        '<div class="game-tip">水稻一生有 <b>3 个需水关键期</b>，需水量完全不同！拖动滑块调节灌溉量，' +
        '把田间含水量稳定在<b>绿色适宜区</b>保持 ' + HOLD_NEED + ' 秒。当心随机天气捣乱——烈日蒸发、阵雨突袭，要及时调水！</div>' +
        '<div class="rain-growth">' +
          STAGES.map(function (s, i) {
            return '<span class="rg-dot' + (i === 0 ? ' current' : '') + '" data-i="' + i + '">' +
              '<i class="rg-icon">' + ['🌱', '🌿', '🌾'][i] + '</i>' + s.name + '</span>';
          }).join('<b class="rg-line"></b>') +
        '</div>' +
        '<div class="rain-stage">' +
          '<img class="img-dry" src="' + G.cdn(IMG_DRY) + '" data-fb="' + IMG_DRY + '" alt="干旱" ' + FB_ERR + '>' +
          '<img class="img-ok" src="' + G.cdn(IMG_OK) + '" data-fb="' + IMG_OK + '" alt="健康" ' + FB_ERR + '>' +
          '<img class="img-bad" src="' + G.cdn(IMG_BAD) + '" data-fb="' + IMG_BAD + '" alt="倒伏" ' + FB_ERR + '>' +
          '<div class="rain-overlay"></div>' +
          '<div class="rain-badge"></div>' +
          '<div class="rain-weather"></div>' +
          '<div class="rain-time"></div>' +
          '<div class="rain-holdbar"><i></i></div>' +
        '</div>' +
        '<div class="rain-controls">' +
          '<input class="rain-slider" type="range" min="0" max="100" value="10">' +
          '<div class="rain-zonebar">' +
            '<i class="rz-ok"></i>' +
            '<b class="rz-cursor"></b>' +
          '</div>' +
          '<div class="rain-scale">' +
            '<span data-z="dry">干旱</span>' +
            '<span data-z="ok">适宜区</span>' +
            '<span data-z="bad">洪涝</span>' +
          '</div>' +
          '<button class="btn btn-sm rain-start" type="button" style="margin-top:12px">开 始 灌 溉</button>' +
        '</div>';

      var slider = root.querySelector('.rain-slider');
      var imgs = {
        dry: root.querySelector('.img-dry'),
        ok: root.querySelector('.img-ok'),
        bad: root.querySelector('.img-bad')
      };
      var badge = root.querySelector('.rain-badge');
      var weatherEl = root.querySelector('.rain-weather');
      var timeEl = root.querySelector('.rain-time');
      var holdBar = root.querySelector('.rain-holdbar i');
      var cursor = root.querySelector('.rz-cursor');
      var zoneOk = root.querySelector('.rz-ok');
      var overlay = root.querySelector('.rain-overlay');
      var labels = root.querySelectorAll('.rain-scale span');
      var startBtn = root.querySelector('.rain-start');

      // 雨滴
      var drops = [], bases = [];
      for (var i = 0; i < 46; i++) {
        var d = G.el('span', 'raindrop');
        d.style.left = Math.random() * 100 + '%';
        d.style.height = (14 + Math.random() * 16) + 'px';
        d.style.animationDelay = (-Math.random() * 2) + 's';
        var base = 0.7 + Math.random() * 0.7;
        d.style.animationDuration = base + 's';
        overlay.appendChild(d);
        drops.push(d); bases.push(base);
      }

      // 太阳光斑
      var sun = G.el('span', 'rain-sun');
      root.querySelector('.rain-stage').appendChild(sun);

      var WEATHERS = [
        { key: 'sun', icon: '☀️', name: '烈日暴晒', dur: 4, effect: -26 },
        { key: 'shower', icon: '🌦️', name: '阵雨突袭', dur: 3, effect: 26 },
        { key: 'cloud', icon: '☁️', name: '多云阴凉', dur: 3, effect: 0 }
      ];

      function zoneOf(v) {
        var s = STAGES[stageIdx];
        return v < s.lo ? 'dry' : (v <= s.hi ? 'ok' : 'bad');
      }

      function render() {
        var s = STAGES[stageIdx];
        var zone = zoneOf(moisture);
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('show', k === zone); });
        labels.forEach(function (l) { l.classList.toggle('active', l.dataset.z === zone); });
        badge.textContent = s.name + ' · ' + (zone === 'ok' ? '水量适宜 ✓' : zone === 'dry' ? '干旱缺水' : '水多了！');
        cursor.style.left = moisture + '%';
        holdBar.style.width = Math.min(100, hold / HOLD_NEED * 100) + '%';
        timeEl.textContent = '⏱ ' + Math.ceil(timeLeft) + 's';
        timeEl.classList.toggle('urgent', timeLeft < 8);

        // 适宜区位置随生长期变化
        zoneOk.style.left = s.lo + '%';
        zoneOk.style.width = (s.hi - s.lo) + '%';

        // 雨滴密度
        drops.forEach(function (dr, idx) {
          var visRatio = currentWeather && currentWeather.key === 'shower' ? 0.9 : moisture / 100;
          if (moisture <= 2 || idx / drops.length > visRatio) {
            dr.style.display = 'none';
          } else {
            dr.style.display = 'block';
            dr.style.animationDuration = (bases[idx] * (1.5 - moisture / 130)).toFixed(2) + 's';
          }
        });
        sun.style.display = (currentWeather && currentWeather.key === 'sun') ? 'block' : 'none';
      }

      function setWeather() {
        currentWeather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
        weatherEl.textContent = currentWeather.icon + ' ' + currentWeather.name;
        weatherEl.classList.add('pop');
        setTimeout(function () { weatherEl.classList.remove('pop'); }, 500);
        if (currentWeather.effect) {
          moisture = Math.max(0, Math.min(100, moisture + currentWeather.effect));
        }
        weatherTimer = setTimeout(setWeather, (3.5 + Math.random() * 2.5) * 1000);
      }

      function tick() {
        if (!running) return;
        var s = STAGES[stageIdx];
        timeLeft -= 0.1;

        // 含水量向滑块设定值靠拢
        var target = Number(slider.value);
        moisture += (target - moisture) * 0.06;
        // 自然蒸发（烈日下加倍）
        moisture -= (currentWeather && currentWeather.key === 'sun') ? 0.9 : 0.25;
        moisture = Math.max(0, Math.min(100, moisture));

        if (zoneOf(moisture) === 'ok') {
          hold += 0.1;
          if (hold >= HOLD_NEED) {
            // 本期达成
            running = false;
            clearTimeout(weatherTimer);
            root.querySelectorAll('.rg-dot').forEach(function (el) {
              if (Number(el.dataset.i) === stageIdx) el.classList.add('done');
            });
            if (stageIdx >= STAGES.length - 1) {
              won = true;
              api.toast('三季水法皆合，嘉禾成熟！');
              setTimeout(function () { api.win(); }, 600);
              render();
              return;
            }
            api.toast(s.name + ' 管理得当，进入下一生长期！');
            stageIdx++;
            timeLeft = STAGES[stageIdx].time;
            hold = 0;
            moisture = 50;
            slider.value = 50;
            root.querySelectorAll('.rg-dot').forEach(function (el) {
              el.classList.toggle('current', Number(el.dataset.i) === stageIdx);
            });
            render();
            currentWeather = null;
            weatherTimer = setTimeout(setWeather, 2200);
            setTimeout(function () { running = true; }, 900);
            return;
          }
        } else {
          hold = Math.max(0, hold - 0.18);
        }

        if (timeLeft <= 0) {
          // 本季超时，重新给时间（不判死，友好重试）
          timeLeft = s.time;
          hold = 0;
          api.toast('错过了「' + s.name + '」的时机，再来一次！');
        }
        render();
      }

      function start() {
        running = true;
        startBtn.style.display = 'none';
        currentWeather = null;
        weatherTimer = setTimeout(setWeather, 2200);
        clearInterval(timer);
        timer = setInterval(tick, 100);
      }

      startBtn.addEventListener('click', start);
      slider.addEventListener('input', function () {});
      render();

      return function () {
        clearInterval(timer);
        clearTimeout(weatherTimer);
      };
    }
  });
})();
