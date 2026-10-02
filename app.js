const CONTACT_API_URL = 'https://formsubmit.co/ajax/phillywedotransformations@gmail.com';
const eventConfig = { date: 'Coming soon' };
document.querySelectorAll('[data-event-date]').forEach(el => el.textContent = eventConfig.date);
const form = document.getElementById('rsvp-form');
const formStatus = document.getElementById('form-status');
const submitButton = form.querySelector('button[type="submit"]');
const emailFallback = document.getElementById('email-fallback');
let submitting = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form));
  if (payload._honey) return;
  emailFallback.href = 'mailto:phillywedotransformations@gmail.com?subject=' +
    encodeURIComponent('Website enquiry: ' + payload.interest) + '&body=' +
    encodeURIComponent(`Name: ${payload.name}\nReply email: ${payload.email}\nInterest: ${payload.interest}\n\n${payload.message}`);
  submitting = true;
  submitButton.disabled = true;
  form.setAttribute('aria-busy', 'true');
  formStatus.dataset.state = 'pending';
  formStatus.textContent = 'Sending your enquiry…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    if (window.location.protocol === 'file:') throw new Error('offline-preview');
    payload._url = window.location.href.split('#')[0].split('?')[0];
    const response = await fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const result = await response.json();
    if (/activat|confirm.{0,20}email/i.test(result.message || '')) throw new Error('activation-needed');
    if (!response.ok || ![true, 'true'].includes(result.success)) throw new Error('submission-failed');
    form.reset();
    formStatus.dataset.state = 'success';
    formStatus.textContent = 'Your enquiry has been submitted. Thank you for connecting with Philly We Do Transformations.';
  } catch (error) {
    formStatus.dataset.state = 'error';
    formStatus.textContent = error.message === 'activation-needed'
      ? 'Online enquiries are awaiting activation. Please email phillywedotransformations@gmail.com directly.'
      : error.message === 'offline-preview'
        ? 'This is a local preview; online sending requires the published website. Your message has not been sent. Use “Email us directly” below to open your email app with your message.'
        : 'We could not confirm your submission. Your message is still here. Please retry, or use “Email us directly” below.';
  } finally {
    clearTimeout(timeout);
    submitting = false;
    submitButton.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
document.querySelectorAll('[data-interest]').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('contact-interest').value = link.dataset.interest;
    document.getElementById('contact-name').focus({ preventScroll: true });
  });
});

const coachTrack = document.querySelector('.coach-track');
const coachCards = [...document.querySelectorAll('.coach-card')];
let coachIndex = 0;
const coachRegion = document.getElementById('coaches');
const pauseButton = document.getElementById('coach-pause');
let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function moveCoaches(direction = 0) {
  coachIndex = (coachIndex + direction + coachCards.length) % coachCards.length;
  const offset = coachCards[coachIndex].offsetLeft - coachCards[0].offsetLeft;
  coachTrack.style.transform = `translateX(-${offset}px)`;
  coachCards.forEach((card, index) => {
    card.classList.toggle('is-featured', index === coachIndex);
    card.setAttribute('aria-hidden', String(index !== coachIndex));
    card.inert = index !== coachIndex;
  });
  document.getElementById('coach-position').textContent = `${coachIndex + 1} / ${coachCards.length}`;
}
document.getElementById('coach-prev').addEventListener('click', () => moveCoaches(-1));
document.getElementById('coach-next').addEventListener('click', () => moveCoaches(1));
function showPauseState() {
  pauseButton.textContent = paused ? 'Play rotation' : 'Pause rotation';
  pauseButton.setAttribute('aria-pressed', String(paused));
}
pauseButton.addEventListener('click', () => { paused = !paused; showPauseState(); });
coachRegion.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); moveCoaches(event.key === 'ArrowRight' ? 1 : -1);
  }
});
setInterval(() => {
  if (!paused && !document.hidden && !coachRegion.matches(':hover') && !coachRegion.contains(document.activeElement)) moveCoaches(1);
}, 5000);
window.addEventListener('resize', () => moveCoaches());
showPauseState(); moveCoaches();
