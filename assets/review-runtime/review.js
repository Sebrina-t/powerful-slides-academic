/* Local review runtime: semantic text runs, slide anchors, and adjacent comment editors. */
(function (global) {
  'use strict';
  function mount(options) {
    const root = options.root || document.body;
    const slides = [...root.querySelectorAll(options.slides || '.interactive-slide')];
    const key = 'academic-review:' + options.deckId;
    if (!options.deckId || !slides.length) throw new Error('Review requires deckId and slides');
    if (root.dataset.arMounted) throw new Error('Review already mounted');
    root.dataset.arMounted = 'true';
    const excluded = 'script,style,button,input,textarea,select,svg,canvas,math,[data-review-ignore],[data-ar-ui]';
    const read = value => { try { return JSON.parse(value || 'null'); } catch { return null; } };
    const seed = read(document.getElementById('academic-review-data')?.textContent);
    let saved; try { saved = read(localStorage.getItem(key)); } catch {}
    const state = saved || (seed?.deckId === options.deckId ? seed : null) || { edits: {}, comments: [] };
    state.edits ||= {}; state.comments ||= [];
    let tool = 'annotate', presentationMode = 'review', current = null, target = null;
    const runs = new Map();
    slides.forEach((slide, slideIndex) => {
      slide.dataset.slideId ||= 'slide-' + (slideIndex + 1);
      slide.tabIndex = 0;
      // Only wrap literal text nodes: preserve strong/em, equations, links, and table structure.
      const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
      const nodes = []; let node;
      while ((node = walker.nextNode())) {
        if (node.textContent.trim() && !node.parentElement.closest(excluded)) nodes.push(node);
      }
      nodes.forEach((node, index) => {
        let el = node.parentElement;
        if (!el.dataset.editId || el.childNodes.length !== 1) {
          const span = document.createElement('span');
          span.dataset.editId = (el.dataset.editId || slide.dataset.slideId) + '-run-' + index;
          node.replaceWith(span); span.appendChild(node); el = span;
        }
        if (runs.has(el.dataset.editId)) throw new Error('Duplicate edit ID: ' + el.dataset.editId);
        runs.set(el.dataset.editId, el);
        el.dataset.elementId ||= el.dataset.editId;
        if (Object.hasOwn(state.edits, el.dataset.editId)) el.textContent = state.edits[el.dataset.editId];
      });
    });
    const make = (tag, className, parent) => { const el = document.createElement(tag); el.className = className; el.dataset.arUi = ''; parent.appendChild(el); return el; };
    const toolbar = make('div', 'ar-toolbar', document.body); toolbar.setAttribute('aria-label', '审阅工具');
    const layer = make('div', 'ar-layer', document.body);
    const editor = make('section', 'ar-editor', document.body); editor.hidden = true; editor.setAttribute('role', 'dialog'); editor.setAttribute('aria-label', '就地批注');
    const title = make('h3', '', editor); title.textContent = '当前位置批注';
    const label = make('label', '', editor); label.textContent = '批注内容';
    const input = make('textarea', '', label); input.setAttribute('aria-label', '批注内容');
    const actions = make('div', 'ar-actions', editor);
    const status = make('span', 'ar-status', toolbar); status.setAttribute('role', 'status');
    function announce(text) { status.textContent = text; }
    function persist() {
      state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(key, JSON.stringify(state)); announce('已保存到本地'); }
      catch { announce('本地保存不可用，请导出审阅文件'); }
    }
    function button(parent, text, action) { const b = make('button', '', parent); b.type = 'button'; b.textContent = text; b.addEventListener('click', action); return b; }
    const tools = {};
    for (const [mode, name] of [['annotate','批注'],['edit','编辑全文'],['view','浏览']]) tools[mode] = button(toolbar, name, () => setMode(mode));
    button(toolbar, '导出批注/编辑', () => download('review-comments.json', JSON.stringify(snapshot(), null, 2), 'application/json'));
    button(toolbar, '导出修改后 HTML', exportHTML);
    function close() { editor.hidden = true; current = null; target = null; }
    button(actions, '保存', () => {
      if (!input.value.trim()) { announce('请填写批注内容'); input.focus(); return; }
      const item = current || { id: crypto.randomUUID(), ...target, status: 'open', createdAt: new Date().toISOString() };
      item.text = input.value; item.updatedAt = new Date().toISOString();
      item.context = options.context?.() || {};
      if (!current) state.comments.push(item);
      persist(); close(); renderPins();
    });
    button(actions, '取消', close);
    const resolve = button(actions, '解决', () => {
      if (!current) return;
      current.status = current.status === 'resolved' ? 'open' : 'resolved'; current.updatedAt = new Date().toISOString(); persist(); open(current); renderPins();
    });
    const remove = button(actions, '删除', () => {
      if (!current) return;
      state.comments = state.comments.filter(c => c.id !== current.id); persist(); close(); renderPins();
    });
    function slideById(id) { return slides.find(s => s.dataset.slideId === id); }
    function visible(slide) { const r = slide?.getBoundingClientRect(); return slide && !slide.hidden && getComputedStyle(slide).display !== 'none' && r.width > 0 && r.height > 0; }
    function anchorPoint(item) {
      const slide = slideById(item.slideId); if (!visible(slide)) return null;
      const el = item.elementId && [...slide.querySelectorAll('[data-element-id]')].find(e => e.dataset.elementId === item.elementId);
      const r = (el || slide).getBoundingClientRect();
      return { x:r.left + r.width * (el ? item.elementX ?? .5 : item.x), y:r.top + r.height * (el ? item.elementY ?? .5 : item.y) };
    }
    function positionEditor() {
      if (editor.hidden) return;
      const point = anchorPoint(current || target); if (!point) { close(); return; }
      const w = editor.offsetWidth, h = editor.offsetHeight, gap = 18;
      let x = point.x + gap; if (x + w > innerWidth - 8) x = point.x - w - gap;
      editor.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
      editor.style.top = Math.max(8, Math.min(point.y - 20, innerHeight - h - 8)) + 'px';
    }
    function open(item, isNew = false) {
      current = isNew ? null : item; target = item;
      input.value = isNew ? '' : item.text;
      title.textContent = isNew ? '当前位置批注' : (item.status === 'resolved' ? '已解决的批注' : '当前位置批注');
      resolve.hidden = remove.hidden = isNew;
      resolve.textContent = item.status === 'resolved' ? '重新打开' : '解决';
      editor.hidden = false; positionEditor(); input.focus();
    }
    function renderPins() {
      layer.replaceChildren();
      if (presentationMode !== 'review') return;
      state.comments.forEach((item, index) => {
        const point = anchorPoint(item); if (!point) return;
        const pin = button(layer, String(index + 1), () => { setMode('annotate'); open(item); });
        pin.className = 'ar-pin'; pin.dataset.commentId = item.id; pin.dataset.status = item.status;
        pin.style.left = point.x + 'px'; pin.style.top = point.y + 'px'; pin.title = item.text;
        pin.setAttribute('aria-label', '批注 ' + (index + 1) + ': ' + item.text);
      });
      positionEditor();
    }
    function setMode(mode) {
      if (!Object.hasOwn(tools, mode)) throw new Error('Unknown review mode');
      tool = mode; close(); root.dataset.arTool = mode;
      root.dataset.arEditing = String(mode === 'edit' && presentationMode === 'review');
      runs.forEach(el => { el.contentEditable = mode === 'edit' && presentationMode === 'review' ? 'true' : 'false'; });
      Object.entries(tools).forEach(([name,b]) => b.setAttribute('aria-pressed', String(name === mode)));
      announce(mode === 'annotate' ? '点击文字、图片或空白处添加批注' : mode === 'edit' ? '点击正文、标题、列表或表格文字直接编辑' : '浏览模式');
    }
    function setPresentationMode(mode) {
      presentationMode = mode; toolbar.hidden = layer.hidden = mode !== 'review'; close(); setMode(tool); renderPins();
    }
    root.addEventListener('click', e => {
      if (tool !== 'annotate' || presentationMode !== 'review' || e.target.closest('[data-ar-ui],button,input,textarea,select,a,[data-review-ignore]')) return;
      const slide = e.target.closest(options.slides || '.interactive-slide'); if (!slides.includes(slide)) return;
      const r = slide.getBoundingClientRect(); const el = e.target.closest('[data-element-id]'); const er = el?.getBoundingClientRect();
      const clamp = x => Math.max(0,Math.min(1,x));
      open({slideId:slide.dataset.slideId,elementId:el?.dataset.elementId || null,x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height),elementX:er ? clamp((e.clientX-er.left)/er.width) : null,elementY:er ? clamp((e.clientY-er.top)/er.height) : null},true);
    });
    root.addEventListener('input', e => {
      const el = e.target.closest('[data-edit-id]'); if (!el || tool !== 'edit') return;
      state.edits[el.dataset.editId] = el.textContent; persist(); renderPins();
    });
    root.addEventListener('paste', e => {
      const el = e.target.closest('[data-edit-id]'); if (!el || tool !== 'edit') return;
      e.preventDefault(); const selection = getSelection(); if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0); if (!el.contains(range.commonAncestorContainer)) return;
      range.deleteContents(); const text = document.createTextNode(e.clipboardData.getData('text/plain')); range.insertNode(text); range.setStartAfter(text); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    root.addEventListener('keydown', e => {
      if (e.target.isContentEditable) { if(e.key==='Enter'){e.preventDefault();e.target.blur();} if(['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key))e.stopPropagation(); }
      else if(e.key==='Enter' && tool==='annotate' && presentationMode==='review' && slides.includes(e.target)) {e.preventDefault();open({slideId:e.target.dataset.slideId,elementId:null,x:.5,y:.5},true);}
    });
    editor.addEventListener('keydown', e => { e.stopPropagation(); if(e.key==='Escape')close(); });
    document.addEventListener('keydown', e => { if(e.key==='Escape')close(); });
    const observer = new MutationObserver(records => { if(records.some(r => !r.target.closest('[data-ar-ui]')))renderPins(); }); observer.observe(root,{attributes:true,subtree:true,attributeFilter:['hidden','class','data-mode']});
    addEventListener('resize',renderPins); addEventListener('scroll',renderPins,true);
    function snapshot() { return {schema:'academic-review-v1',deckId:options.deckId,version:options.version,...structuredClone(state),context:options.context?.()||{}}; }
    function download(name, content, type) { const url=URL.createObjectURL(new Blob([content],{type})); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
    function exportHTML() {
      const doc = document.documentElement.cloneNode(true);
      doc.querySelectorAll('[data-ar-ui],#academic-review-data').forEach(el=>el.remove());
      doc.querySelectorAll('[data-ar-mounted]').forEach(el=>{delete el.dataset.arMounted;delete el.dataset.arEditing;delete el.dataset.arTool;});
      doc.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
      const data=document.createElement('script');data.id='academic-review-data';data.type='application/json';data.textContent=JSON.stringify(snapshot()).replace(/</g,'\\u003c');doc.querySelector('body').prepend(data);
      download('review-revised.html','<!doctype html>\n'+doc.outerHTML,'text/html');
    }
    setMode('annotate'); renderPins();
    return {setMode,setPresentationMode,snapshot,exportHTML,refresh:renderPins};
  }
  global.AcademicReview = {mount};
})(window);
