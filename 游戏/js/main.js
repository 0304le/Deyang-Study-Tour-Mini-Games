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
      var card = G.el('button', 'station-card ' + s.id + (done ? ' done' : ''),
        '<span class="card-deco"></span>' +
        (done ? '<span class="done-ribbon">已通关</span>' : '') +
        '<div class="card-top">' +
          '<span class="card-badge">' + s.badge + '</span>' +
          '<div><div class="card-guide">' + s.guide + '</div>' +
          '<div class="card-title">' + (s.title.split(' · ')[1] || s.title) + '</div></div>' +
        '</div>' +
        '<p class="card-desc">' + s.desc + '</p>' +
        '<div class="card-foot">' +
          '<span class="card-play">' + (done ? '再玩一次' : '开始挑战') + ' →</span>' +
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
    if (confirm('确定要清空所有文化碎片、重新开始探索吗？')) {
      G.Store.clear();
      render();
    }
  }
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('resetBtn2').addEventListener('click', reset);
})();
