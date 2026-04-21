/* === NAV SCROLL === */
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* === MOBILE MENU === */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

function closeMenu() {
  if (!navMenu || !navToggle) return;
  navMenu.classList.remove('nav__menu--open');
  navToggle.classList.remove('nav__toggle--active');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('nav__menu--open');
    navToggle.classList.toggle('nav__toggle--active', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

/* === SCROLL REVEAL === */
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('reveal--visible'));
}

/* === PROJECT FILTER (proyectos.html) === */
const filterBtns   = document.querySelectorAll('.filter-btn');
const projectItems = document.querySelectorAll('.project-item');

if (filterBtns.length && projectItems.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      projectItems.forEach(item => {
        const match = filter === 'todos' || item.dataset.category === filter;
        item.style.opacity = '0';
        item.style.transform = 'scale(0.97)';
        setTimeout(() => {
          item.style.display = match ? '' : 'none';
          if (match) {
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            });
          }
        }, 250);
      });
    });
  });

  projectItems.forEach(item => {
    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  });
}

/* === LIGHTBOX (proyectos.html) === */
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = lightbox?.querySelector('.lightbox__img');
const lightboxClose = lightbox?.querySelector('.lightbox__close');
const lightboxPrev  = lightbox?.querySelector('.lightbox__prev');
const lightboxNext  = lightbox?.querySelector('.lightbox__next');
const lightboxMeta  = lightbox?.querySelector('.lightbox__meta');

let lbItems  = [];
let lbIndex  = 0;

function openLightbox(index) {
  const visible = [...projectItems].filter(el => el.style.display !== 'none');
  lbItems  = visible;
  lbIndex  = index;
  showLightboxFrame();
  lightbox.classList.add('lightbox--active');
  document.body.style.overflow = 'hidden';
  lightboxClose?.focus();
}

function closeLightbox() {
  lightbox?.classList.remove('lightbox--active');
  document.body.style.overflow = '';
}

function showLightboxFrame() {
  const item  = lbItems[lbIndex];
  const img   = item.querySelector('img');
  const title = item.querySelector('.project-overlay__title')?.textContent || '';
  const meta  = item.querySelector('.project-overlay__meta')?.textContent  || '';
  lightboxImg.src   = img.src;
  lightboxImg.alt   = img.alt;
  if (lightboxMeta) lightboxMeta.textContent = title + (meta ? ' — ' + meta : '');
}

function stepLightbox(dir) {
  lightboxImg.style.opacity = '0';
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  setTimeout(() => {
    showLightboxFrame();
    lightboxImg.style.opacity = '1';
  }, 140);
}

if (lightbox) {
  projectItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      const visible = [...projectItems].filter(el => el.style.display !== 'none');
      openLightbox(visible.indexOf(item));
    });
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') item.click(); });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click',  () => stepLightbox(-1));
  lightboxNext?.addEventListener('click',  () => stepLightbox(1));

  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('lightbox--active')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   stepLightbox(-1);
    if (e.key === 'ArrowRight')  stepLightbox(1);
  });
}

/* === CONTACT FORM (contacto.html) === */
const contactForm   = document.getElementById('contactForm');
const formSuccess   = document.getElementById('formSuccess');
const formError     = document.getElementById('formError');
const formSubmit    = document.getElementById('formSubmit');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (formError) formError.textContent = '';

    const nombre      = contactForm.nombre.value.trim();
    const correo      = contactForm.correo.value.trim();
    const descripcion = contactForm.descripcion.value.trim();

    if (!nombre || !correo || !descripcion) {
      if (formError) formError.textContent = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    if (formSubmit) {
      formSubmit.disabled    = true;
      formSubmit.textContent = 'Enviando…';
    }

    try {
      const res  = await fetch('/api/contacto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre, correo, descripcion }),
      });
      const data = await res.json();

      if (res.ok) {
        contactForm.hidden  = true;
        if (formSuccess) formSuccess.hidden = false;
      } else {
        if (formError) formError.textContent = data.error || 'Ocurrió un error. Intenta de nuevo.';
        if (formSubmit) { formSubmit.disabled = false; formSubmit.textContent = 'Enviar mensaje'; }
      }
    } catch {
      if (formError) formError.textContent = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      if (formSubmit) { formSubmit.disabled = false; formSubmit.textContent = 'Enviar mensaje'; }
    }
  });
}
