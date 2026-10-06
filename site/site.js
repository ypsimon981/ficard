(() => {
  'use strict';
  const gallery = document.getElementById('screenshot-gallery');
  const previous = document.getElementById('gallery-prev');
  const next = document.getElementById('gallery-next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function updateGalleryControls() {
    previous.disabled = gallery.scrollLeft <= 2;
    next.disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 2;
  }
  function moveGallery(direction) {
    const first = gallery.querySelector('figure');
    const gap = parseFloat(getComputedStyle(gallery).gap) || 0;
    gallery.scrollBy({left: direction * (first.getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', () => moveGallery(-1));
  next.addEventListener('click', () => moveGallery(1));
  gallery.addEventListener('scroll', updateGalleryControls, {passive:true});
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); moveGallery(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  window.addEventListener('resize', updateGalleryControls, {passive:true});
  updateGalleryControls();

  const links = [...document.querySelectorAll('.section-nav > a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let queued = false;
  function updateSection() {
    queued = false;
    const threshold = Math.min(window.innerHeight * .4, 250);
    let active = links[0];
    sections.forEach((section,index) => {if (section.getBoundingClientRect().top <= threshold) active = links[index];});
    links.forEach(link => {
      const selected = link === active;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {if (!queued) {queued = true; requestAnimationFrame(updateSection);}}, {passive:true});
  window.addEventListener('resize', updateSection, {passive:true});
  updateSection();
})();
