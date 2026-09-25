/* 游戏7：民俗讲解员 —— 孝泉保保节分支情景对话 */
(function () {
  'use strict';

  // 图片已下载为本地静态文件（assets/img/），不依赖在线生图接口
  var SCENE = 'assets/img/g7-scene.jpg';

  // speaker：说话人；ok 为正确选项下标；tip 为选错时的中断提示
  var NODES = [
    {
      speaker: '旁白 · 孝泉古镇',
      text: '正月十六清晨，孝泉古镇锣鼓喧天，一年一度的"拉保保"开始了。父亲让你来安排今天的行程——',
      options: ['带上孩子，去武圣宫看热闹，亲历民俗', '人多太挤，在家看电视转播'],
      ok: 0,
      tip: '剧情中断：拉保保讲究的就是到现场"拉"，不出门可就错过整段故事啦。'
    },
    {
      speaker: '抱孩子的母亲',
      text: '武圣宫前人山人海。一位母亲抱着年幼的孩子四处张望，她告诉你们，保保节的寓意是——',
      options: ['给孩子拉一位"保保"（干爹），祈求孩子平安健康长大', '比赛谁力气大，拉住路人请客吃饭'],
      ok: 0,
      tip: '剧情中断：保保节不是比力气，"保保"是干爹，寄托的是护佑孩子成长的祝福。'
    },
    {
      speaker: '旁白 · 人群中',
      text: '说话间，人群里走来一位面容和善的路人。按照传统礼俗，母亲此刻应该——',
      options: ['先请律师签一份认亲合同', '趁路人不备，把宝宝帽戴到他头上，高声喊"拉到保保啦"'],
      ok: 1,
      tip: '剧情中断：认亲合同不符合老规矩——趁其不备"拉"住、戴上宝宝帽，才是保保节的传统仪式。'
    },
    {
      speaker: '被拉住的路人',
      text: '被拉住的路人先是一愣，随后哈哈大笑，欣然接受了这份缘分。按规矩，"新保保"接下来要——',
      options: ['转身就走，以后互不往来', '接过孩子抱抱，发红包、送吉祥话，日后常来常往'],
      ok: 1,
      tip: '剧情中断：拉保保拉的是一世亲缘，新保保要给孩子发红包、送祝福，从此两家走动。'
    },
    {
      speaker: '旁白 · 保保酒上',
      text: '两家人在古镇摆上"保保酒"，孩子当众叩头叫了一声"保保"。走完这条故事线，你的总结是——',
      options: ['一门民俗，联结的是陌生人之间的善意与祝福', '只是凑热闹，并没有什么特别意义'],
      ok: 0,
      tip: '剧情中断：若只看见热闹，就错过了保保节最珍贵的内核——人与人之间的善意联结。'
    }
  ];

  G.register('g7', {
    guide: '民俗讲解员',
    title: '孝泉保保节 · 情景对话',
    frag: '保节',
    tagline: '拉保保，结干亲；一顶宝宝帽，接住人间善意。',

    mount: function (root, api) {
      root.innerHTML =
        '<div class="game-tip">跟随剧情做出选择。<b>选错会提示"剧情中断"，需要重新选择</b>；全程不中断地走完故事线即可通关。</div>' +
        '<img class="dlg-scene" src="' + SCENE + '" alt="孝泉保保节">' +
        '<div class="dlg-box"></div>';

      var box = root.querySelector('.dlg-box');
      var step = 0, won = false;

      function renderNode() {
        var n = NODES[step];
        box.innerHTML =
          '<div class="dlg-speaker">' + n.speaker + '</div>' +
          '<div class="dlg-text">' + n.text + '</div>' +
          '<div class="dlg-options"></div>' +
          '<div class="dlg-progress">剧情进度：' + (step + 1) + ' / ' + NODES.length + '</div>';
        var opts = box.querySelector('.dlg-options');
        n.options.forEach(function (t, i) {
          var b = G.el('button', '', String.fromCharCode(65 + i) + '. ' + t);
          b.type = 'button';
          b.addEventListener('click', function () {
            if (i === n.ok) {
              b.style.background = 'var(--jade)';
              b.style.color = '#fff';
              b.style.borderColor = 'var(--jade)';
              setTimeout(function () {
                step++;
                if (step >= NODES.length) {
                  if (!won) { won = true; api.win(); }
                } else {
                  renderNode();
                }
              }, 550);
            } else {
              showOops(n.tip);
            }
          });
          opts.appendChild(b);
        });
      }

      function showOops(tip) {
        box.innerHTML =
          '<div class="dlg-oops">' +
            '<h3>剧情中断</h3>' +
            '<p>' + tip + '</p>' +
            '<button class="btn btn-sm" type="button">重新选择</button>' +
          '</div>';
        box.querySelector('button').addEventListener('click', renderNode);
      }

      renderNode();
    }
  });
})();
