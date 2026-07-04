// ================================================================
// NAVIGATION
// ================================================================
function navigateToTab(viewId) {
  const pageMap = {
    'home-view': 'index.html',
    'about-view': 'about.html',
    'academics-view': 'academics.html',
    'students-view': 'events.html',
    'notices-view': 'notices.html',
    'help-view': 'help.html'
  };
  const targetPage = pageMap[viewId];
  if (targetPage) window.location.href = targetPage;
}

// ================================================================
// CAROUSEL (homepage notices)
// ================================================================
let currentNoticeSlide = 0;
let noticeSlides = [];
let noticeDots = [];

function slideToNotice(index) {
  if (noticeSlides.length === 0) return;
  noticeSlides.forEach(s => s.classList.remove('active-slide'));
  noticeDots.forEach(d => d.classList.remove('active'));
  currentNoticeSlide = index % noticeSlides.length;
  if (noticeSlides[currentNoticeSlide]) noticeSlides[currentNoticeSlide].classList.add('active-slide');
  if (noticeDots[currentNoticeSlide]) noticeDots[currentNoticeSlide].classList.add('active');
}

function autoSlideNotices() {
  if (noticeSlides.length === 0) return;
  currentNoticeSlide = (currentNoticeSlide + 1) % noticeSlides.length;
  slideToNotice(currentNoticeSlide);
}

// ================================================================
// IMAGE MODALS (toppers, etc.)
// ================================================================
function openImageModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeImageModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// ================================================================
// NOTICE DETAILS MODAL
// ================================================================
function openNoticeModal(notice) {
  const modal = document.getElementById('notice-detail-modal');
  const content = document.getElementById('notice-detail-content');
  if (!modal || !content) return;

  // Title / description
  document.getElementById('notice-modal-title').textContent = notice.title;
  document.getElementById('notice-modal-body').textContent = notice.description;

  // Badge & result styling
  const badge = document.getElementById('notice-modal-badge');
  if (notice.type === 'result') {
    badge.textContent = 'Result Published';
    content.classList.add('result-published');
  } else {
    badge.textContent = 'Announcement';
    content.classList.remove('result-published');
  }

  // Notice image inside modal (if present)
  const existingImg = content.querySelector('.notice-modal-image');
  if (existingImg) existingImg.remove();

  if (notice.image) {
    const img = document.createElement('img');
    img.src = notice.image;
    img.alt = notice.title;
    img.className = 'notice-modal-image';
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openNoticeLightbox(notice.image));
    // Insert image right before the body text
    content.querySelector('.notice-detail-header').after(img);
  }

  // Links
  const linksContainer = document.getElementById('notice-modal-links');
  linksContainer.innerHTML = '';
  if (notice.links && notice.links.length > 0) {
    const titleEl = document.createElement('div');
    titleEl.className = 'notice-detail-links-title';
    titleEl.textContent = 'Relevant Links';
    linksContainer.appendChild(titleEl);

    notice.links.forEach((link, idx) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = link.name;

      if (notice.type === 'result') {
        a.className = idx === 0 ? 'action-btn' : 'action-link-btn';
      } else {
        a.className = idx === 0 ? 'action-btn' : 'action-link-btn';
      }
      a.style.cssText = 'width:100%;text-align:center;text-decoration:none;display:block;';
      if (idx < notice.links.length - 1) a.style.marginBottom = '8px';
      linksContainer.appendChild(a);
    });
  }

  modal.classList.add('active');
}

function closeNoticeModal() {
  const modal = document.getElementById('notice-detail-modal');
  if (modal) modal.classList.remove('active');
}

let isLightboxZoomed = false;

function openNoticeLightbox(imageSrc) {
  const lightbox = document.getElementById('notice-image-lightbox');
  const img = document.getElementById('lightbox-zoom-image');
  if (!lightbox || !img) return;

  img.src = imageSrc;
  img.style.transform = 'scale(1)';
  img.style.cursor = 'zoom-in';
  isLightboxZoomed = false;

  lightbox.classList.add('active');
}

function closeNoticeLightbox() {
  const lightbox = document.getElementById('notice-image-lightbox');
  const img = document.getElementById('lightbox-zoom-image');
  if (lightbox) lightbox.classList.remove('active');
  if (img) {
    img.style.transform = 'scale(1)';
    isLightboxZoomed = false;
  }
}

// ================================================================
// ACADEMICS WIZARD — 3-step flow (Type → Scheme → Semester)
// ================================================================
const acadState = { currentStep: 1, type: '', scheme: '' };

function selectAcadType(type) {
  acadState.type = type;
  _goToAcadStep(2);
}

function selectAcadScheme(scheme) {
  acadState.scheme = scheme;
  _goToAcadStep(3);
  populateSemesters();
}

function selectAcadSemester(sem) {
  // Step 3 selection → immediately fetch the Drive link and open it
  const url = `/api/academics/link?type=${encodeURIComponent(acadState.type)}&scheme=${encodeURIComponent(acadState.scheme)}&semester=${encodeURIComponent(sem)}`;

  fetch(url)
    .then(res => {
      if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Link not found'); });
      return res.json();
    })
    .then(data => {
      if (data.drive_link) {
        window.open(data.drive_link, '_blank');
      } else {
        alert('Google Drive folder link is not yet configured for this selection. Please check back later.');
      }
    })
    .catch(err => {
      alert('This folder link has not been configured yet. Please check back later.\n\n(' + err.message + ')');
    });
}

function prevAcadStep() {
  if (acadState.currentStep > 1) _goToAcadStep(acadState.currentStep - 1);
}

function _goToAcadStep(targetStep) {
  // Deactivate current
  const currentStepEl = document.getElementById(`acad-step-${acadState.currentStep}`);
  const currentIndEl = document.getElementById(`acad-step-ind-${acadState.currentStep}`);
  if (currentStepEl) currentStepEl.classList.remove('active-step');
  if (currentIndEl) currentIndEl.classList.remove('active');

  acadState.currentStep = targetStep;

  // Activate new
  const newStepEl = document.getElementById(`acad-step-${acadState.currentStep}`);
  const newIndEl = document.getElementById(`acad-step-ind-${acadState.currentStep}`);
  if (newStepEl) newStepEl.classList.add('active-step');
  if (newIndEl) newIndEl.classList.add('active');
}

function populateSemesters() {
  const container = document.getElementById('semesters-list');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 8; i++) {
    const btn = document.createElement('button');
    btn.className = 'wizard-btn-medium';
    btn.textContent = `Semester ${i}`;
    btn.onclick = () => selectAcadSemester(`Semester ${i}`);
    container.appendChild(btn);
  }
}

// ================================================================
// NOTICE PAGE — split-card renderer
// ================================================================

// SVG placeholder icon (megaphone)
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M18 11v-1l2-1v6l-2-1v-1h-2v-2h2zm-3-6.94V18.94C13.9 19 12.97 19 12 19c-3.87 0-7-1.79-7-4v-1.26A3.001 3.001 0 0 1 3 11V9a3 3 0 0 1 2-2.83V6c0-2.21 3.13-4 7-4 .97 0 1.9.06 2.78.19C15.59 2.58 15 3.26 15 4.06zM13 17.91V6.09C12.37 6.03 11.7 6 11 6c-2.97 0-5 1.12-5 2s2.03 2 5 2c.37 0 .72-.02 1.06-.05A5.97 5.97 0 0 0 11 12c0 1.78.78 3.38 2 4.47v1.44zM11 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
</svg>`;

function renderNoticesPage(notices) {
  const container = document.getElementById('notices-list-container');
  if (!container) return;

  container.innerHTML = '';
  if (notices.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">No announcements posted yet.</p>';
    return;
  }

  notices.forEach(notice => {
    const card = document.createElement('div');
    card.className = 'notice-split-card';

    // Left: image or placeholder
    if (notice.image) {
      const img = document.createElement('img');
      img.src = notice.image;
      img.alt = notice.title;
      img.className = 'notice-split-img';
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'notice-split-placeholder';
      placeholder.innerHTML = PLACEHOLDER_SVG;
      card.appendChild(placeholder);
    }

    // Right: details
    const isResult = notice.type === 'result';
    const details = document.createElement('div');
    details.className = 'notice-split-details';
    details.innerHTML = `
      <div class="notice-split-meta">
        <span class="notice-split-badge ${isResult ? 'result' : ''}">${isResult ? 'Result Published' : 'Announcement'}</span>
      </div>
      <div class="notice-split-title">${notice.title}</div>
      <div class="notice-split-desc">${notice.description.substring(0, 200)}${notice.description.length > 200 ? '…' : ''}</div>
    `;
    card.appendChild(details);

    card.addEventListener('click', () => openNoticeModal(notice));
    container.appendChild(card);
  });
}

// ================================================================
// HOMEPAGE CAROUSEL renderer
// ================================================================
function renderHomepageCarousel(notices) {
  const container = document.getElementById('notice-carousel-container');
  const controls = document.getElementById('notice-carousel-controls');
  if (!container) return;

  container.innerHTML = '';
  if (controls) controls.innerHTML = '';

  const latestNotices = notices.slice(0, 3);
  if (latestNotices.length === 0) {
    container.innerHTML = `<div class="notice-slide active-slide">
      <div class="notice-card"><div class="notice-card-content">
        <p style="text-align:center;color:var(--text-muted);">No notices available.</p>
      </div></div></div>`;
    return;
  }

  latestNotices.forEach((notice, index) => {
    const slide = document.createElement('div');
    slide.className = `notice-slide ${index === 0 ? 'active-slide' : ''}`;

    const badgeText = notice.type === 'result' ? 'Result' : 'Announcement';
    const isResult = notice.type === 'result';

    slide.innerHTML = `
      <div class="notice-card" style="cursor:pointer;">
        <div class="notice-card-header">
          <span class="notice-badge" style="${isResult ? 'background:rgba(0,180,216,0.15);color:var(--glow-cyan);font-weight:700;' : ''}">${badgeText}</span>
        </div>
        <div class="notice-card-content">
          <h3>${notice.title}</h3>
          <p>${notice.description.substring(0, 150)}${notice.description.length > 150 ? '…' : ''}</p>
        </div>
      </div>`;

    slide.querySelector('.notice-card').addEventListener('click', () => openNoticeModal(notice));
    container.appendChild(slide);

    if (controls) {
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => slideToNotice(index));
      controls.appendChild(dot);
    }
  });

  noticeSlides = document.querySelectorAll('.notice-slide');
  noticeDots = document.querySelectorAll('.carousel-dot');
  currentNoticeSlide = 0;
}

// ================================================================
// EVENTS renderer — students page card grid
// ================================================================
function renderEventsPage(events) {
  const container = document.getElementById('events-list-container');
  if (!container) return;

  container.innerHTML = '';
  if (events.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">No upcoming events at this time.</p>';
    return;
  }

  events.forEach(event => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding:0;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;';
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.18)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    card.addEventListener('click', () => openEventModal(event));

    card.innerHTML = `
      <div style="width:100%;aspect-ratio:16/9;overflow:hidden;background:#f1f5f9;position:relative;">
        <img src="${event.poster_url}" alt="${event.title}" style="width:100%;height:100%;object-fit:cover;">
        <span class="label" style="position:absolute;top:16px;left:16px;background:rgba(15,43,92,0.9);color:#fff;border:none;">${event.date}</span>
      </div>
      <div style="padding:20px 24px;flex-grow:1;display:flex;flex-direction:column;">
        <span class="label" style="margin-bottom:8px;align-self:flex-start;background:var(--bg-light);color:var(--accent);border:1px solid var(--border);font-size:11px;font-weight:700;text-transform:uppercase;">${event.time} | ${event.venue}</span>
        <h3 style="margin:4px 0 10px 0;font-size:18px;color:var(--primary);font-weight:600;">${event.title}</h3>
        <p style="color:var(--text-muted);font-size:13.5px;line-height:1.5;margin-bottom:14px;flex-grow:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${event.description}</p>
        <span style="color:var(--accent);font-size:13px;font-weight:600;">View Details &rarr;</span>
      </div>`;

    container.appendChild(card);
  });
}

// ================================================================
// HOMEPAGE EVENTS PHOTO GRID renderer
// ================================================================
function renderHomepageEvents(events) {
  const container = document.getElementById('home-events-grid');
  if (!container) return;

  container.innerHTML = '';
  const latest = events.slice(0, 4);
  if (latest.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:20px;">No events posted yet.</p>';
    return;
  }

  latest.forEach(event => {
    const item = document.createElement('div');
    item.className = 'event-photo-item';
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => openEventModal(event));
    item.innerHTML = `
      <img src="${event.poster_url}" alt="${event.title}">
      <div class="event-photo-caption">${event.title}</div>`;
    container.appendChild(item);
  });
}

// ================================================================
// EVENT DETAIL MODAL
// ================================================================
function openEventModal(event) {
  const modal = document.getElementById('event-detail-modal');
  if (!modal) return;

  document.getElementById('event-modal-title').textContent = event.title;
  document.getElementById('event-modal-date').textContent = event.date;
  document.getElementById('event-modal-desc').textContent = event.description;

  const timeVenue = [event.time, event.venue].filter(Boolean).join(' | ');
  document.getElementById('event-modal-time-venue').textContent = timeVenue;

  const posterWrap = document.getElementById('event-modal-poster-wrap');
  const posterImg = document.getElementById('event-modal-poster');
  if (event.poster_url) {
    posterImg.src = event.poster_url;
    posterImg.alt = event.title;
    posterImg.style.cursor = 'zoom-in';
    posterImg.style.objectFit = 'contain';
    posterImg.onclick = () => openNoticeLightbox(event.poster_url);
    posterWrap.style.display = 'block';
  } else {
    posterWrap.style.display = 'none';
    posterImg.onclick = null;
  }

  const regLink = document.getElementById('event-modal-reg');
  if (event.registration_link) {
    regLink.href = event.registration_link;
    regLink.style.display = 'inline-block';
  } else {
    regLink.style.display = 'none';
  }

  const instaLink = document.getElementById('event-modal-insta');
  if (instaLink) {
    if (event.instagram_link) {
      instaLink.href = event.instagram_link;
      instaLink.style.display = 'inline-block';
    } else {
      instaLink.style.display = 'none';
    }
  }

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeEventModal() {
  const modal = document.getElementById('event-detail-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close event modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('event-detail-modal');
    if (modal && modal.style.display !== 'none') {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
});

// ================================================================
// GLOBAL INITIALISATION
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('notices-list-container');
  const carouselContainer = document.getElementById('notice-carousel-container');
  const eventsContainer = document.getElementById('events-list-container');
  const homeEventsContainer = document.getElementById('home-events-grid');

  // Fetch & render notices
  if (listContainer || carouselContainer) {
    fetch('/api/notices')
      .then(res => res.json())
      .then(notices => {
        if (listContainer) renderNoticesPage(notices);
        if (carouselContainer) {
          renderHomepageCarousel(notices);
          setInterval(autoSlideNotices, 5000);
        }
      })
      .catch(err => {
        console.error('Error fetching notices:', err);
        if (listContainer) listContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Failed to load announcements.</p>';
      });
  }

  // Fetch & render events
  if (eventsContainer || homeEventsContainer) {
    fetch('/api/events')
      .then(res => res.json())
      .then(events => {
        if (eventsContainer) renderEventsPage(events);
        if (homeEventsContainer) renderHomepageEvents(events);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        if (eventsContainer) eventsContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Failed to load events.</p>';
      });
  }

  // Close modals on backdrop click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('notice-detail-modal')) {
      if (e.target.id === 'notice-image-lightbox') {
        closeNoticeLightbox();
      } else {
        closeNoticeModal();
      }
    }
    if (e.target.classList.contains('image-modal')) e.target.classList.remove('active');
  });

  // Escape key closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeNoticeModal();
      closeNoticeLightbox();
      document.querySelectorAll('.image-modal').forEach(m => m.classList.remove('active'));
    }
  });

  // Setup click-to-zoom in lightbox
  const lightboxImg = document.getElementById('lightbox-zoom-image');
  if (lightboxImg) {
    lightboxImg.addEventListener('click', (ev) => {
      ev.stopPropagation(); // prevent backdrop click closing
      isLightboxZoomed = !isLightboxZoomed;
      if (isLightboxZoomed) {
        lightboxImg.style.transform = 'scale(1.5)';
        lightboxImg.style.cursor = 'zoom-out';
      } else {
        lightboxImg.style.transform = 'scale(1)';
        lightboxImg.style.cursor = 'zoom-in';
      }
    });
  }
});
