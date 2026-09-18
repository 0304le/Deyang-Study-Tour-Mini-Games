/* AI 研学报告：集齐九碎片后解锁
   纯前端直连硅基流动（该 API 支持浏览器跨域），内置密钥开箱即用
   注意：内置密钥会暴露给所有访客，请勿公开传播站点；如需保护密钥请改用后端代理 */
(function () {
  'use strict';

  // 内置硅基流动密钥（开箱即用，无需任何部署）
  var BUILTIN_KEY = 'sk-jagevwbedghlkxhsbtmehqnjtoakneutylfepsmbcsspbnst';

  var DIRECT_API = 'https://api.siliconflow.cn/v1/chat/completions';
  var MODEL_STORE = 'deyang_sf_model_v1';
  var NAME_STORE = 'deyang_report_name_v1';
  // 主模型 + 自动回退（模型下线/无权限时依次尝试）
  var FALLBACK_MODELS = ['deepseek-ai/DeepSeek-V4-Flash', 'deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-V3'];

  function getKey() { return BUILTIN_KEY; }
  function getModel() { try { return localStorage.getItem(MODEL_STORE) || FALLBACK_MODELS[0]; } catch (e) { return FALLBACK_MODELS[0]; } }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /* ====== 拼装研学轨迹（数据来自 main.js 的九大站点） ====== */
  var studentName = '';
  function buildPrompt() {
    var stations = (window.STATIONS || []).map(function (s, i) {
      return (i + 1) + '. ' + s.guide + '｜' + s.title +
        '（文化碎片【' + s.frag + '】）。研学任务：' + s.desc +
        ' 文化寄语：' + s.tagline;
    }).join('\n');

    var safeName = (studentName || '').replace(/[<>&\n\r]/g, '').slice(0, 20);
    var nameClause = safeName
      ? '学生称呼为「' + safeName + '」。报告抬头"研学人"必须署名为「' + safeName + '」，并在研学概况开头自然称呼该学生（如"' + safeName + '同学"），全文语气可适度带有称呼感。'
      : '学生未留称呼。报告抬头"研学人"署名为"线上研学课程学员"即可，不要编造姓名。';

    var system = '你是一位资深的中小学研学实践教育导师，熟悉四川德阳的历史文化，文风端正、温暖、富有启发，' +
      '善于把互动游戏中的体验升华为文化知识与思考。使用规范简体中文，用 Markdown 排版，不使用表格以外的特殊符号堆砌。';

    var user =
      '一名学生刚刚完成线上研学课程《德阳文化探秘之旅》，通过九个互动关卡集齐了九枚文化碎片。' +
      nameClause +
      '九个研学站点如下：\n' + stations + '\n\n' +
      '请为这名学生生成一份完整的《德阳文化探秘 · AI 研学报告》，日期署为 ' + today() + '，结构必须包含：\n' +
      '# 德阳文化探秘 · 研学报告\n' +
      '## 一、研学概况\n说明研学形式（线上互动研学）、集齐的九枚文化碎片（古蜀、忠魂、石镌、年画、翠山、嘉禾、保节、锦纹、蜀味）与总体评价。\n' +
      '## 二、九站研学记录\n逐个站点分段，每段包含【文化知识】【互动体验回顾】【知识要点】三个小点，语言要具体（写出白马关、黄继光、庞统祠、绵竹年画、龙门山、水稻灌溉、保保节、蜀锦、连山回锅肉等真实内容）。\n' +
      '## 三、文化脉络梳理\n用一条主线把九站串联（如古蜀文明—红色精神—文保非遗—自然农耕—民俗美食），讲清德阳文化的整体格局。\n' +
      '## 四、研学收获\n从知识、能力、情感三个维度总结。\n' +
      '## 五、拓展探究\n布置 3 个可在线下或德阳实地完成的探究任务。\n' +
      '全文 1200～2000 字，直接输出报告正文，不要输出任何额外说明。';

    return { system: system, user: user };
  }

  /* ====== 极简 Markdown 渲染（先转义防注入） ====== */
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>');
  }
  function md2html(md) {
    var lines = escapeHtml(md).replace(/\r\n/g, '\n').split('\n');
    var html = '', i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }
      // 分隔线
      if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }
      // 标题
      var hm = line.match(/^(#{1,4})\s+(.*)$/);
      if (hm) { html += '<h' + hm[1].length + '>' + inline(hm[2]) + '</h' + hm[1].length + '>'; i++; continue; }
      // 无序列表
      if (/^\s*[-*]\s+/.test(line)) {
        html += '<ul>';
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          html += '<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>';
          i++;
        }
        html += '</ul>';
        continue;
      }
      // 有序列表
      if (/^\s*\d+[.、]\s+/.test(line)) {
        html += '<ol>';
        while (i < lines.length && /^\s*\d+[.、]\s+/.test(lines[i])) {
          html += '<li>' + inline(lines[i].replace(/^\s*\d+[.、]\s+/, '')) + '</li>';
          i++;
        }
        html += '</ol>';
        continue;
      }
      // 引用
      if (/^\s*>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          q.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        html += '<blockquote>' + inline(q.join('<br>')) + '</blockquote>';
        continue;
      }
      // 普通段落（合并连续行）
      var p = [];
      while (i < lines.length && lines[i].trim() &&
        !/^(#{1,4})\s/.test(lines[i]) && !/^\s*[-*]\s/.test(lines[i]) &&
        !/^\s*\d+[.、]\s/.test(lines[i]) && !/^\s*>/.test(lines[i]) &&
        !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])) {
        p.push(lines[i]); i++;
      }
      html += '<p>' + inline(p.join('<br>')) + '</p>';
    }
    return html;
  }

  /* ====== 主流程 ====== */
  function openReport() {
    // 双重保险：未集齐不开放
    var allGot = (window.STATIONS || []).every(function (s) { return window.G && G.Store.has(s.id); });
    if (!allGot) { alert('集齐九枚文化碎片后，AI 研学报告才会解锁哦～'); return; }

    var saved = loadReport();
    if (saved && saved.content) {
      askViewChoice(saved, function (choice) {
        if (choice === 'view') {
          studentName = saved.name || '';
          openReportLayer();
          showSavedReport(saved);
        } else {
          askName(function (name) {
            studentName = name || '';
            openReportLayer();
          });
        }
      });
    } else {
      askName(function (name) {
        studentName = name || '';
        openReportLayer();
      });
    }
  }

  /* 已有报告：查看上次 / 重新生成 */
  function askViewChoice(saved, onChoose) {
    var exist = document.querySelector('.name-layer');
    if (exist) exist.remove();

    var layer = el('div', 'name-layer');
    var timeText = saved.time ? new Date(saved.time).toLocaleString('zh-CN') : '';
    layer.innerHTML =
      '<div class="name-card">' +
        '<button class="name-close" type="button" aria-label="关闭">&times;</button>' +
        '<div class="name-icon">📚</div>' +
        '<h3>找到上次的研学报告</h3>' +
        '<p class="name-sub">生成于 ' + timeText + (saved.name ? '　研学人：' + escapeHtml(saved.name) : '') + '</p>' +
        '<div class="name-btns" style="flex-direction:column;align-items:stretch">' +
          '<button class="btn btn-sm name-go" type="button">查看上次报告</button>' +
          '<button class="btn btn-ghost btn-sm name-skip" type="button">重新生成一份</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    function close(choice) {
      layer.remove();
      document.body.style.overflow = '';
      if (choice) onChoose(choice);
    }
    layer.querySelector('.name-go').addEventListener('click', function () { close('view'); });
    layer.querySelector('.name-skip').addEventListener('click', function () { close('regen'); });
    layer.querySelector('.name-close').addEventListener('click', function () { close(null); });
    layer.addEventListener('click', function (e) { if (e.target === layer) close(null); });
  }

  /* ====== 报告本地记忆 ====== */
  var REPORT_STORE = 'deyang_ai_report_v1';
  function loadReport() {
    try {
      var raw = localStorage.getItem(REPORT_STORE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveReport(content) {
    try {
      localStorage.setItem(REPORT_STORE, JSON.stringify({
        name: studentName || '',
        content: content,
        time: Date.now()
      }));
    } catch (e) { /* 存储超限时忽略，不影响当次查看 */ }
  }
  function clearReport() { try { localStorage.removeItem(REPORT_STORE); } catch (e) {} }

  /* 直接展示已保存的报告 */
  function showSavedReport(saved) {
    var body = document.querySelector('.report-layer .report-body');
    if (!body) return;
    var raw = saved.content;
    body.innerHTML =
      '<div class="rp-stream done"></div>' +
      '<div class="rp-saved-tip">📚 这是你保存于本机的上次报告（未重新生成）</div>' +
      '<div class="rp-actions">' +
        '<button class="btn btn-sm rp-copy" type="button">复制全文</button>' +
        '<button class="btn btn-sm rp-download" type="button">下载报告</button>' +
        '<button class="btn btn-ghost btn-sm rp-regen" type="button">重新生成</button>' +
      '</div>';
    var streamEl = body.querySelector('.rp-stream');
    streamEl.innerHTML = md2html(raw);
    bindResultActions(body, raw);
  }

  /* 称呼（选填）弹窗：确认→带称呼生成；跳过→匿名生成；×→取消不生成 */
  function askName(onDone) {
    var exist = document.querySelector('.name-layer');
    if (exist) exist.remove();

    var saved = '';
    try { saved = localStorage.getItem(NAME_STORE) || ''; } catch (e) {}

    var layer = el('div', 'name-layer');
    layer.innerHTML =
      '<div class="name-card">' +
        '<button class="name-close" type="button" aria-label="关闭">&times;</button>' +
        '<div class="name-icon">📜</div>' +
        '<h3>如何称呼你？</h3>' +
        '<p class="name-sub">填写后，AI 研学导师将以你的称呼署名报告</p>' +
        '<label class="name-label">姓名 / 称呼 <span class="name-opt">选填</span></label>' +
        '<input class="name-input" type="text" maxlength="20" placeholder="如：小明同学" autocomplete="off">' +
        '<div class="name-btns">' +
          '<button class="btn btn-ghost btn-sm name-skip" type="button">跳过</button>' +
          '<button class="btn btn-sm name-go" type="button">确认并生成</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    var input = layer.querySelector('.name-input');
    input.value = saved;
    setTimeout(function () { input.focus(); }, 100);

    function finish(name, persist) {
      if (persist) { try { localStorage.setItem(NAME_STORE, name || ''); } catch (e) {} }
      layer.remove();
      document.body.style.overflow = '';
      onDone(name || '');
    }
    function cancel() {
      layer.remove();
      document.body.style.overflow = '';
    }

    layer.querySelector('.name-go').addEventListener('click', function () {
      finish(input.value.trim(), true);
    });
    layer.querySelector('.name-skip').addEventListener('click', function () { finish('', false); });
    layer.querySelector('.name-close').addEventListener('click', cancel);
    layer.addEventListener('click', function (e) { if (e.target === layer) cancel(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') finish(input.value.trim(), true);
      if (e.key === 'Escape') cancel();
    });
  }

  function openReportLayer() {
    var exist = document.querySelector('.report-layer');
    if (exist) exist.remove();

    var layer = el('div', 'report-layer');
    layer.innerHTML =
      '<div class="report-card">' +
        '<div class="report-head">' +
          '<div><span class="rp-tag">AI 研学导师 · DeepSeek</span>' +
          '<h2>我的德阳文化研学报告</h2></div>' +
          '<button class="rp-close" type="button" aria-label="关闭">&times;</button>' +
        '</div>' +
        '<div class="report-body"></div>' +
      '</div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';

    var body = layer.querySelector('.report-body');
    function close() {
      layer.remove();
      document.body.style.overflow = '';
    }
    layer.querySelector('.rp-close').addEventListener('click', close);
    layer.addEventListener('click', function (e) { if (e.target === layer) close(); });

    // 内置密钥直连，直接生成
    generateView(body, getKey());
  }

  /* 生成中：流式输出 */
  function generateView(body, apiKey) {
    var abortCtl = null;
    var stopped = false;
    var raw = '';

    body.innerHTML =
      '<div class="rp-loading">' +
        '<div class="rp-spin"></div>' +
        '<p class="rp-status">正在连接 DeepSeek-V4-Flash，梳理你的九站研学轨迹…</p>' +
      '</div>' +
      '<div class="rp-stream" hidden></div>' +
      '<div class="rp-actions" hidden>' +
        '<button class="btn btn-sm rp-copy" type="button">复制全文</button>' +
        '<button class="btn btn-sm rp-download" type="button">下载报告</button>' +
        '<button class="btn btn-ghost btn-sm rp-regen" type="button">重新生成</button>' +
      '</div>';

    var loading = body.querySelector('.rp-loading');
    var statusEl = body.querySelector('.rp-status');
    var streamEl = body.querySelector('.rp-stream');
    var actions = body.querySelector('.rp-actions');

    var stopBtn = el('button', 'btn btn-ghost btn-sm rp-stop', '停止生成');
    loading.appendChild(stopBtn);

    var renderQueued = false;
    function renderStream() {
      renderQueued = false;
      streamEl.innerHTML = md2html(raw) + '<span class="rp-cursor">▍</span>';
    }
    function queueRender() {
      if (!renderQueued) {
        renderQueued = true;
        requestAnimationFrame(renderStream);
      }
    }

    function finish() {
      streamEl.innerHTML = md2html(raw);
      streamEl.classList.add('done');
      actions.hidden = false;
      loading.hidden = true;
      // 记忆：生成完成后保存到本机，下次可直接查看
      if (raw && raw.length > 200) saveReport(raw);
    }

    function failView(msg, tip) {
      loading.hidden = true;
      streamEl.hidden = true;
      var box = el('div', 'rp-error');
      box.innerHTML =
        '<div class="rp-keyicon">⚠️</div><h3>生成失败</h3>' +
        '<p class="rp-errmsg">' + msg + '</p>' +
        (tip ? '<p class="rp-errtip">' + tip + '</p>' : '') +
        '<div class="rp-erracts">' +
          '<button class="btn btn-sm rp-retry" type="button">重试</button>' +
        '</div>';
      body.insertBefore(box, actions);
      box.querySelector('.rp-retry').addEventListener('click', function () {
        box.remove(); generateView(body, apiKey);
      });
    }

    stopBtn.addEventListener('click', function () {
      stopped = true;
      if (abortCtl) abortCtl.abort();
      if (raw) finish(); else failView('已手动停止生成。', '');
    });

    // 模型尝试链：用户自定义模型优先，然后回退列表
    var attemptModels = [getModel()].concat(FALLBACK_MODELS).filter(function (v, i, a) {
      return v && a.indexOf(v) === i;
    });

    function attempt(idx) {
      if (stopped) return;
      var model = attemptModels[idx];
      var prompt = buildPrompt();
      abortCtl = new AbortController();
      statusEl.textContent = '模型 ' + model + ' 正在撰写报告…';

      // 直连硅基流动
      fetch(DIRECT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
          enable_thinking: false
        }),
        signal: abortCtl.signal
      }).then(function (resp) {
        if (!resp.ok) {
          return resp.text().then(function (txt) {
            var msg = 'HTTP ' + resp.status;
            try { var j = JSON.parse(txt); if (j.error && j.error.message) msg = j.error.message; else if (j.message) msg = j.message; } catch (e) {}
            var err = new Error(msg);
            err.status = resp.status;
            err.modelRelated = /model|disabled|404/.test(msg);
            throw err;
          });
        }
        loading.hidden = true;
        streamEl.hidden = false;

        var reader = resp.body.getReader();
        var decoder = new TextDecoder('utf-8');
        var buffer = '';

        function pump() {
          return reader.read().then(function (r) {
            if (r.done) { finish(); return; }
            buffer += decoder.decode(r.value, { stream: true });
            var parts = buffer.split('\n');
            buffer = parts.pop();
            parts.forEach(function (line) {
              line = line.trim();
              if (!line.indexOf('data:')) line = line.slice(5).trim();
              if (!line || line === '[DONE]') return;
              try {
                var j = JSON.parse(line);
                var delta = j.choices && j.choices[0] && j.choices[0].delta;
                if (delta && delta.content) {
                  raw += delta.content;
                  queueRender();
                }
              } catch (e) { /* 分片不完整，忽略 */ }
            });
            return pump();
          });
        }
        return pump();
      }).catch(function (err) {
        if (stopped) return;
        // 模型类错误且还有备选模型 → 自动回退
        if ((err.modelRelated || err.status === 400 || err.status === 404) && idx < attemptModels.length - 1) {
          statusEl.textContent = '模型不可用，正在切换备用模型…';
          setTimeout(function () { attempt(idx + 1); }, 500);
          return;
        }
        var tip = '';
        if (err.status === 401) tip = '内置密钥可能已失效，请联系站点维护者。';
        else if (err.status === 429) tip = '请求过于频繁或账户额度不足，请稍后再试。';
        else if (/Failed to fetch|NetworkError/i.test(err.message)) tip = '网络无法连接硅基流动，请检查网络后重试。';
        else tip = '服务暂时不可用，请稍后点击重试。';
        failView(err.message || '未知错误', tip);
      });
    }

    // 结果操作（复制/下载/重新生成）
    bindResultActions(body, function () { return raw; });

    attempt(0);
  }

  /* 复制 / 下载 / 重新生成（实时生成与已保存报告共用） */
  function bindResultActions(body, getRaw) {
    var regen = body.querySelector('.rp-regen');
    if (regen) regen.addEventListener('click', function () {
      var actions = body.querySelector('.rp-actions');
      if (actions) actions.hidden = true;
      var tip = body.querySelector('.rp-saved-tip');
      if (tip) tip.remove();
      clearReport();
      generateView(body, getKey());
    });
    var copyBtn = body.querySelector('.rp-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var btn = this, text = getRaw();
      function done() { var t = btn.textContent; btn.textContent = '✓ 已复制'; setTimeout(function () { btn.textContent = t; }, 1500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
    var dlBtn = body.querySelector('.rp-download');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      var blob = new Blob([getRaw()], { type: 'text/markdown;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '德阳文化探秘-研学报告.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  window.AIReport = { open: openReport };

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('aiReportBtn');
    if (btn) btn.addEventListener('click', openReport);
  });
})();
