/* 主页面：九大讲解员站点渲染、碎片进度 */
(function () {
  'use strict';

  // 站点顺序即卡片顺序；badge 为卡片上的单字标识
  var STATIONS = [
    { id: 'g1', badge: '蜀', guide: '历史讲解员', title: '白马关 · 图片碎片拼图',
      desc: '拖动碎片，依次复原白马关、德阳文庙、三星堆面具三幅画面。', frag: '古蜀',
      tagline: '白马关中，鼓角远去；古蜀雄关，风骨长存。' },
    { id: 'g2', badge: '忠', guide: '红色讲解员', title: '揭线索 · 识英雄',
      desc: '逐条揭开线索，判断三位德阳英雄各是谁——黄继光、杨锐、张栻。', frag: '忠魂',
      tagline: '铁血担当，英雄不朽；最可爱的人，魂铸中江。' },
    { id: 'g3', badge: '物', guide: '文物讲解员', title: '点击爆破 · 文物气球',
      desc: '45秒限时打气球，爆破 5 枚德阳文物气球，小心干扰项与漏网惩罚。', frag: '石镌',
      tagline: '砖石无言，文物有声；一祠一砖，镌刻德阳。' },
    { id: 'g4', badge: '画', guide: '非遗讲解员', title: '绵竹年画 · 福娃填色',
      desc: '选一支颜色，为绵竹年画抱鱼福娃点染新年的喜气。', frag: '年画',
      tagline: '一纸年画，年年如意；粉笺敷彩，非遗新生。' },
    { id: 'g5', badge: '山', guide: '自然讲解员', title: '龙门山 · 全景寻物探秘',
      desc: '穿行林海、溪谷、高山三景，找齐珙桐、锦鸡、大鲵、小熊猫等九种生灵。', frag: '翠山',
      tagline: '珍禽奇木，自在龙门；翠岭生灵，皆是馈赠。' },
    { id: 'g6', badge: '禾', guide: '农耕讲解员', title: '农田灌溉 · 三季雨水',
      desc: '插秧、分蘖、抽穗三个需水期各不相同，还要应对烈日阵雨的随机天气。', frag: '嘉禾',
      tagline: '风调雨顺，嘉禾丛生；一粥一饭，仰赖天时。' },
    { id: 'g7', badge: '俗', guide: '民俗讲解员', title: '孝泉保保节 · 情景对话',
      desc: '正月十六的孝泉古镇，每个选择都决定你能否走完整条故事线。', frag: '保节',
      tagline: '拉保保，结干亲；一顶宝宝帽，接住人间善意。' },
    { id: 'g8', badge: '锦', guide: '文创美育讲解员', title: '放大镜 · 蜀锦纹样识别',
      desc: '移动放大镜细看四幅锦样，辨出翔凤穿花、八达晕、联珠天马等纹样真名。', frag: '锦纹',
      tagline: '寸锦寸金，织就风华；一丝一线，纹样千年。' },
    { id: 'g9', badge: '味', guide: '饮食文化讲解员', title: '灶台投料 · 连山回锅肉',
      desc: '三阶段十二步投料，从冷水煮肉到红油起锅，错一步就要从头再来。', frag: '蜀味',
      tagline: '一菜一格，百肉香魂；连山回锅，蜀味人间。' }
  ];

  var grid = document.getElementById('stationGrid');

  function render() {
    grid.innerHTML = '';
    var got = 0;
    STATIONS.forEach(function (s) {
      var done = G.Store.has(s.id);
      if (done) got++;
      var unlocked = G.isUnlocked(s.id);
      var card = G.el('button', 'station-card ' + s.id + (done ? ' done' : '') + (unlocked ? '' : ' locked'),
        '<span class="card-deco"></span>' +
        (done ? '<span class="done-ribbon">已通关</span>' : '') +
        (unlocked ? '' : '<span class="card-lock">🔒</span>') +
        '<div class="card-top">' +
          '<span class="card-badge">' + s.badge + '</span>' +
          '<div><div class="card-guide">' + s.guide + '</div>' +
          '<div class="card-title">' + (s.title.split(' · ')[1] || s.title) + '</div></div>' +
        '</div>' +
        '<p class="card-desc">' + s.desc + '</p>' +
        '<div class="card-foot">' +
          '<span class="card-play">' + (done ? '再玩一次' : (unlocked ? '开始挑战' : '🔑 输入密钥')) + ' →</span>' +
          '<span class="seal ' + (done ? 'got' : '') + '">' + s.frag + '</span>' +
        '</div>');
      card.addEventListener('click', function () { G.open(s.id); });
      grid.appendChild(card);
    });

    document.getElementById('progressText').textContent = got + ' / 9';
    document.getElementById('progressBar').style.width = (got / 9 * 100) + '%';

    var bar = document.getElementById('fragmentBar');
    bar.innerHTML = '';
    STATIONS.forEach(function (s) {
      var d = G.Store.has(s.id);
      var m = G.el('span', 'mini-seal' + (d ? ' got' : ''), s.frag);
      m.title = s.title;
      bar.appendChild(m);
    });

    document.getElementById('allDone').hidden = got !== 9;
  }

  window.STATIONS = STATIONS;
  window.refreshHub = render;
  render();

  function reset() {
    if (confirm('确定要清空所有文化碎片、重新开始探索吗？（已生成的研学报告也会清除）')) {
      G.Store.clear();
      // 同步清除研学报告记忆、称呼与关卡解锁
      try {
        localStorage.removeItem('deyang_ai_report_v1');
        localStorage.removeItem('deyang_report_name_v1');
        localStorage.removeItem('deyang_unlocked_v1');
      } catch (e) {}
      render();
    }
  }

  /* ====== 跨设备存档码 ======
     本机进度本来就自动保存（关页面也在）；存档码用于换电脑/换浏览器/分享进度 */
  function progressBits() {
    var bits = 0;
    STATIONS.forEach(function (s, i) { if (G.Store.has(s.id)) bits |= (1 << i); });
    return bits;
  }
  function unlockBits() {
    var bits = 0;
    STATIONS.forEach(function (s, i) { if (G.isUnlocked(s.id)) bits |= (1 << i); });
    return bits;
  }
  function getSavedName() {
    try { return localStorage.getItem('deyang_report_name_v1') || ''; } catch (e) { return ''; }
  }
  function makeCode() {
    var payload = { v: 2, b: progressBits(), u: unlockBits(), n: getSavedName() };
    var json = JSON.stringify(payload);
    var b64 = btoa(unescape(encodeURIComponent(json))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return 'DY2-' + b64;
  }
  function parseCode(code) {
    try {
      var raw = String(code).trim().replace(/^DY2\s*-?\s*/i, '').replace(/-/g, '+').replace(/_/g, '/');
      while (raw.length % 4) raw += '=';
      var data = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (!data || (data.v !== 1 && data.v !== 2) || typeof data.b !== 'number' || data.b < 0 || data.b > 511) return null;
      if (data.v === 1) data.u = data.b; // 旧码：通关即解锁
      if (typeof data.u !== 'number' || data.u < 0 || data.u > 511) data.u = data.b;
      return data;
    } catch (e) { return null; }
  }
  function applyCode(data) {
    var all = G.Store.all();
    var unlocks = {};
    STATIONS.forEach(function (s, i) {
      if (data.b & (1 << i)) all[s.id] = 1;
      if (data.u & (1 << i)) unlocks[s.id] = 1;
    });
    try {
      localStorage.setItem('deyang_culture_fragments_v1', JSON.stringify(all));
      localStorage.setItem('deyang_unlocked_v1', JSON.stringify(unlocks));
    } catch (e) {}
    if (data.n) { try { localStorage.setItem('deyang_report_name_v1', String(data.n).slice(0, 20)); } catch (e) {} }
    render();
  }

  function openSaveDialog() {
    var exist = document.querySelector('.save-layer');
    if (exist) exist.remove();
    var gotCount = STATIONS.filter(function (s) { return G.Store.has(s.id); }).length;
    var layer = document.createElement('div');
    layer.className = 'name-layer save-layer';
    layer.innerHTML =
      '<div class="name-card" style="max-width:430px">' +
        '<button class="name-close" type="button">&times;</button>' +
        '<div class="name-icon">🎒</div>' +
        '<h3>研学进度存档</h3>' +
        '<p class="name-sub">当前进度：<b>' + gotCount + ' / 9</b> 枚碎片。本机进度会自动保存；' +
        '复制下面的存档码，换电脑或换浏览器时粘贴即可恢复。</p>' +
        '<label class="name-label">我的存档码</label>' +
        '<div style="display:flex;gap:8px">' +
          '<input class="name-input save-code-out" readonly>' +
          '<button class="btn btn-sm save-copy" type="button" style="flex:0 0 auto">复制</button>' +
        '</div>' +
        '<label class="name-label" style="margin-top:16px">在其他设备输入存档码恢复进度</label>' +
        '<div style="display:flex;gap:8px">' +
          '<input class="name-input save-code-in" placeholder="粘贴 DY2- 开头的存档码" autocomplete="off">' +
          '<button class="btn btn-sm save-load" type="button" style="flex:0 0 auto">读档</button>' +
        '</div>' +
        '<p class="save-msg" style="font-size:12.5px;color:var(--jade);min-height:18px;margin-top:10px"></p>' +
      '</div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    var out = layer.querySelector('.save-code-out');
    out.value = makeCode();
    var msg = layer.querySelector('.save-msg');
    function close() { layer.remove(); document.body.style.overflow = ''; }
    layer.querySelector('.name-close').addEventListener('click', close);
    layer.addEventListener('click', function (e) { if (e.target === layer) close(); });
    layer.querySelector('.save-copy').addEventListener('click', function () {
      out.select();
      var ok = function () { msg.textContent = '✓ 存档码已复制，请妥善保存'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.value).then(ok).catch(function () {
          document.execCommand('copy'); ok();
        });
      } else { document.execCommand('copy'); ok(); }
    });
    var codeIn = layer.querySelector('.save-code-in');
    layer.querySelector('.save-load').addEventListener('click', function () {
      var data = parseCode(codeIn.value);
      if (!data) { msg.style.color = 'var(--red)'; msg.textContent = '× 存档码无效，请检查后重新粘贴'; return; }
      applyCode(data);
      msg.style.color = 'var(--jade)';
      msg.textContent = '✓ 读档成功！';
      out.value = makeCode();
      setTimeout(close, 900);
    });
    codeIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') layer.querySelector('.save-load').click(); });
  }

  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('resetBtn2').addEventListener('click', reset);
  var saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', openSaveDialog);
})();
