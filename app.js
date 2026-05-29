/* ERIC REMY — site behavior */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- MARQUEE — built from the live dates, always in sync ---------- */
  const mt = document.getElementById('marqueeTrack');
  if (mt) {
    // Pull upcoming shows straight from the Live Dates section so the marquee
    // never goes stale — edit a date there and the strip updates automatically.
    const dateEls = [...document.querySelectorAll('#dates .date')];
    const shows = dateEls.map(d => {
      const when  = d.querySelector('.date-when .d')?.textContent.trim() || '';
      const venue = d.querySelector('.date-venue')?.textContent.trim() || '';
      const city  = (d.querySelector('.date-city')?.textContent.trim() || '').replace(/,.*$/, '');
      return `${when} — ${venue}, ${city}`.toUpperCase();
    });
    const bolt = '<span class="bolt"></span>';
    const parts = ['LIVE FROM THE UNDERGROUND', ...shows];
    const items = parts.map(p => `<span class="marquee-item">${p} ${bolt}</span>`).join('');
    // duplicate the run so the loop is seamless
    mt.innerHTML = items + items;
  }

  /* ---------- NAV scrolled state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Smooth anchor scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Hero 2.5D parallax — mouse on desktop, gyroscope on mobile ---------- */
  const heroBg = document.getElementById('heroBg');
  const heroRender = document.getElementById('heroRender');
  const heroSil = document.getElementById('heroSilhouette');
  const heroWord = document.querySelector('.hero-bigword');
  const hero = document.querySelector('.hero');
  if (hero && heroRender && !reduceMotion) {
    let raf = null, tx = 0, ty = 0;
    const apply2d = () => {
      // foreground (DJ) moves most, bigword mid, background least — depth
      if (heroBg)     heroBg.style.transform     = `scale(1.12) translate(${tx*-6}px, ${ty*-5}px)`;
      if (heroWord)   heroWord.style.transform   = `translate(calc(-50% + ${tx*-13}px), calc(-50% + ${ty*-10}px)) rotate(${tx*0.4}deg)`;
      // silhouette swings widest → can cross from his left to his right, like a detaching shadow
      if (heroSil)    heroSil.style.transform    = `scale(1.08) translate(${-9 + tx*35}px, ${-5 + ty*20}px)`;
      if (heroRender) heroRender.style.transform  = `scale(1.08) translate(${tx*22}px, ${ty*16}px)`;
      raf = null;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply2d); };
    const recenter = () => {
      tx = 0; ty = 0;
      if (heroBg)     heroBg.style.transform = 'scale(1.12)';
      if (heroWord)   heroWord.style.transform = 'translate(-50%,-50%)';
      if (heroSil)    heroSil.style.transform = 'scale(1.08) translate(-9px, -5px)';
      if (heroRender) heroRender.style.transform = 'scale(1.08)';
    };

    // DESKTOP — mouse
    if (window.matchMedia('(pointer:fine)').matches) {
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        schedule();
      });
      hero.addEventListener('mouseleave', recenter);
    }

    // MOBILE — real-time device tilt (gyroscope)
    const isTouch = window.matchMedia('(pointer:coarse)').matches;
    if (isTouch && window.DeviceOrientationEvent) {
      let baseGamma = null, baseBeta = null;
      const onTilt = (e) => {
        if (e.gamma == null || e.beta == null) return;
        // calibrate to however the phone is first held, then track deflection
        if (baseGamma == null) { baseGamma = e.gamma; baseBeta = e.beta; }
        const clamp = (v) => Math.max(-0.5, Math.min(0.5, v));
        tx = clamp((e.gamma - baseGamma) / 36); // left/right tilt
        ty = clamp((e.beta  - baseBeta)  / 36); // front/back tilt
        schedule();
      };
      const startTilt = () => window.addEventListener('deviceorientation', onTilt, true);
      // iOS 13+ needs explicit permission, triggered by a tap
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const ask = () => {
          DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') startTilt();
          }).catch(() => {});
          window.removeEventListener('touchend', ask);
        };
        window.addEventListener('touchend', ask, { once: true });
      } else {
        startTilt();
      }
    }
  }

  /* ---------- Scroll parallax (booth slideshow) ---------- */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const run = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const frac = Math.max(-1, Math.min(1, (center - vh / 2) / (vh / 2)));
        el.querySelectorAll('img').forEach(img => {
          const max = (img.offsetHeight - el.offsetHeight) / 2;
          img.style.transform = `translateY(${(-frac * max).toFixed(1)}px)`;
        });
      });
      ticking = false;
    };
    const onP = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', onP, { passive: true });
    window.addEventListener('resize', onP);
    run();
  }

  /* ---------- Booth slideshow: random auto-advance, swipe, reveal ---------- */
  const booth = document.getElementById('boothSlides');
  if (booth) {
    const slides = [...booth.querySelectorAll('.booth-slide')];
    const dotsWrap = document.getElementById('boothDots');
    slides.forEach((_, i) => {
      const d = document.createElement('span');
      if (i === 0) d.classList.add('active');
      d.addEventListener('click', (e) => { e.stopPropagation(); show(i); resetTimer(); });
      dotsWrap.appendChild(d);
    });
    const dots = [...dotsWrap.children];
    let cur = 0, order = [], ptr = 0, timer = null;
    const shuffle = (n) => { const a = [...Array(n).keys()]; for (let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
    function show(i) {
      slides[cur].classList.remove('active'); dots[cur].classList.remove('active');
      cur = i;
      slides[cur].classList.add('active'); dots[cur].classList.add('active');
    }
    function nextRandom() {
      if (ptr >= order.length) { order = shuffle(slides.length).filter(x => x !== cur); ptr = 0; if (!order.length) order = [(cur+1)%slides.length]; }
      show(order[ptr++]);
    }
    function go(dir) { show((cur + dir + slides.length) % slides.length); resetTimer(); }
    function resetTimer() { if (reduceMotion) return; clearInterval(timer); timer = setInterval(nextRandom, 2000); }
    resetTimer();

    // swipe (touch)
    let sx = null, moved = false;
    booth.addEventListener('touchstart', e => { sx = e.touches[0].clientX; moved = false; }, { passive: true });
    booth.addEventListener('touchmove', () => { moved = true; }, { passive: true });
    booth.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      sx = null;
    }, { passive: true });
    // drag (mouse)
    let px = null;
    booth.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') px = e.clientX; });
    booth.addEventListener('pointerup', e => {
      if (px == null) return;
      const dx = e.clientX - px; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); px = null;
    });
  }

  /* ---------- Track expand → lazy Spotify embed ---------- */
  document.querySelectorAll('.track').forEach(track => {
    const btn = track.querySelector('.track-row');
    const embed = track.querySelector('.track-embed');
    const albumId = track.dataset.album;
    btn.addEventListener('click', () => {
      const isOpen = track.classList.contains('open');
      // close others
      document.querySelectorAll('.track.open').forEach(t => {
        if (t !== track) { t.classList.remove('open'); t.querySelector('.track-embed').style.height = '0px'; }
      });
      if (isOpen) {
        track.classList.remove('open');
        embed.style.height = '0px';
      } else {
        if (!embed.querySelector('iframe')) {
          const f = document.createElement('iframe');
          f.src = `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`;
          f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
          f.loading = 'lazy';
          f.height = '152';
          embed.appendChild(f);
        }
        track.classList.add('open');
        embed.style.height = '152px';
      }
    });
  });

  /* ---------- Animated count-up + LIVE polling of stats.json ---------- */
  const fmt = n => Number(n).toLocaleString('en-US');
  function animateCount(el, to, dur = 1800) {
    const from = Number(el.dataset.current || 0);
    if (reduceMotion || from === to) { el.textContent = fmt(to); el.dataset.current = to; return; }
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const v = Math.round(from + (to - from) * ease(p));
      el.textContent = fmt(v);
      if (p < 1) requestAnimationFrame(step);
      else el.dataset.current = to;
    }
    requestAnimationFrame(step);
  }

  const counters = [...document.querySelectorAll('[data-stat]')];
  let started = false;
  function applyStats(data, animate) {
    counters.forEach(el => {
      const key = el.dataset.stat;
      const val = data[key];
      if (val == null) return;
      if (animate) animateCount(el, val);
      else { el.textContent = fmt(val); el.dataset.current = val; }
    });
  }
  async function fetchStats() {
    try {
      const res = await fetch('stats.json?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) { return null; }
  }
  // initial: count up from 0 when the stats band scrolls into view
  const band = document.getElementById('statsBand');
  if (band) {
    const sio = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true; sio.disconnect();
        const data = await fetchStats();
        if (data) applyStats(data, true);
        // begin live polling — any change to stats.json updates the page in place
        setInterval(async () => {
          const fresh = await fetchStats();
          if (fresh) applyStats(fresh, true);
        }, 15000);
      }
    }, { threshold: 0.3 });
    sio.observe(band);
  }

  /* ---------- Mobile tab-bar active state (scroll spy) ---------- */
  const tabs = [...document.querySelectorAll('.tabbar a')];
  if (tabs.length) {
    const sections = tabs.map(t => document.querySelector(t.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = '#' + e.target.id;
          tabs.forEach(t => t.classList.toggle('active', t.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));
  }

})();
