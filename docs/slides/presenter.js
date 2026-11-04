// Presenter support uses the current DOM, so previews and thumbnails cannot contain an old deck.
(() => {
  const sections = [...document.querySelectorAll('#presentation .slides > section')];
  const speakerMode = new URLSearchParams(location.search).has('speaker');
  let speakerWindow;
  const position = () => Reveal.getIndices().h;
  const updateSpeaker = () => speakerWindow?.postMessage({ courseDeck: true, type: 'position', index: position() }, '*');
  function openSpeaker() {
    const url = new URL(location.href); url.search = '?speaker=1';
    speakerWindow = window.open(url.href, 'course-speaker', 'width=1280,height=900');
    if (!speakerWindow) document.querySelector('#presenter-status').textContent = 'Allow this local file to open the presenter window.';
  }
  if (speakerMode) {
    document.body.classList.add('speaker-mode');
    const root = document.querySelector('#speaker');
    root.innerHTML = `<header><h1>Presenter · portfolio career workspace</h1><span id="speaker-counter"></span><div><button id="speaker-prev">Previous</button> <button id="speaker-next">Next</button></div></header><div class="speaker-views"><div><h2>Current</h2><div id="current-preview" class="preview-frame"></div></div><div><h2>Next</h2><div id="next-preview" class="preview-frame"></div></div></div><div id="speaker-notes"></div><div id="speaker-thumbnails"></div>`;
    let current = 0;
    function preview(frame, i) {
      frame.replaceChildren(); if (!sections[i]) return;
      const reveal = document.createElement('div'); reveal.className = 'reveal';
      const slides = document.createElement('div'); slides.className = 'slides';
      const clone = sections[i].cloneNode(true); clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelector('.notes')?.remove(); slides.append(clone); reveal.append(slides); frame.append(reveal);
      reveal.style.transform = `scale(${frame.clientWidth / 1600})`;
    }
    function refresh() {
      preview(document.querySelector('#current-preview'), current);
      preview(document.querySelector('#next-preview'), current + 1);
      document.querySelector('#speaker-counter').textContent = `${current + 1} / ${sections.length}`;
      document.querySelector('#speaker-notes').textContent = sections[current].querySelector('.notes')?.textContent || '';
      document.querySelectorAll('#speaker-thumbnails button').forEach((button, i) => {
        if (i === current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
      });
    }
    function select(index) {
      current = Math.max(0, Math.min(index, sections.length - 1)); refresh();
      window.opener?.postMessage({ courseDeck: true, type: 'select', index: current }, '*');
    }
    sections.forEach((section, i) => {
      const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('aria-label', `Go to slide ${i + 1}: ${section.dataset.title}`);
      const frame = document.createElement('div'); frame.className = 'preview-frame';
      const label = document.createElement('span'); label.className = 'thumb-label'; label.textContent = `${i + 1}. ${section.dataset.title}`;
      button.append(frame, label); document.querySelector('#speaker-thumbnails').append(button); preview(frame, i);
      button.addEventListener('click', () => select(i));
    });
    document.querySelector('#speaker-prev').onclick = () => select(current - 1);
    document.querySelector('#speaker-next').onclick = () => select(current + 1);
    addEventListener('keydown', event => {
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); select(current + 1); }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); select(current - 1); }
    });
    addEventListener('message', event => {
      if (event.source !== window.opener || !event.data?.courseDeck || event.data.type !== 'position') return;
      if (!Number.isInteger(event.data.index)) return;
      current = Math.max(0, Math.min(event.data.index, sections.length - 1)); refresh();
    });
    addEventListener('resize', () => {
      refresh(); document.querySelectorAll('#speaker-thumbnails .preview-frame').forEach((frame, i) => preview(frame, i));
    });
    refresh(); window.opener?.postMessage({ courseDeck: true, type: 'ready' }, '*');
  } else {
    Reveal.initialize({ width: 1600, height: 900, margin: 0, minScale: 0.1, maxScale: 2,
      center: false, hash: true, slideNumber: false, controls: false, transition: 'none',
      backgroundTransition: 'none', pdfSeparateFragments: false, pdfMaxPagesPerSlide: 1,
      defaultTiming: 60 });
    Reveal.addKeyBinding({ keyCode: 83, key: 'S', description: 'Speaker view' }, openSpeaker);
    Reveal.on('slidechanged', updateSpeaker);
    document.querySelector('#speaker-button').onclick = openSpeaker;
    document.querySelector('#previous-button').onclick = () => Reveal.prev();
    document.querySelector('#next-button').onclick = () => Reveal.next();
    document.querySelector('#overview-button').onclick = () => Reveal.toggleOverview();
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#/lesson-"]'); if (!link) return;
      event.preventDefault(); const lesson = link.getAttribute('href').slice('#/lesson-'.length);
      const index = sections.findIndex(section => section.dataset.lesson === lesson);
      if (index >= 0) Reveal.slide(index);
    });
    addEventListener('message', event => {
      if (event.source !== speakerWindow || !event.data?.courseDeck) return;
      if (event.data.type === 'ready') updateSpeaker();
      if (event.data.type === 'select' && Number.isInteger(event.data.index)) Reveal.slide(Math.max(0, Math.min(event.data.index, sections.length - 1)));
    });
  }
})();
