const CONTACT_API_URL = 'https://formsubmit.co/ajax/phillywedotransformations@gmail.com';
const eventConfig = {
  date: 'Saturday, October 17, 2026',
  time: '9:00 AM',
  venue: 'Discovery Center',
  address: '3401 Reservoir Drive, Philadelphia, PA 19121'
};
for (const [field, value] of Object.entries(eventConfig)) {
  document.querySelectorAll(`[data-event-${field}]`).forEach(el => el.textContent = value);
}
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

const blueprintTabs = [...document.querySelectorAll('[data-blueprint-target]')];
const blueprintPanels = [...document.querySelectorAll('.blueprint-panel')];
function showBlueprint(panelId) {
  blueprintTabs.forEach(tab => {
    const selected = tab.dataset.blueprintTarget === panelId;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });
  blueprintPanels.forEach(panel => { panel.hidden = panel.id !== panelId; });
}
blueprintTabs.forEach(tab => tab.addEventListener('click', () => showBlueprint(tab.dataset.blueprintTarget)));

const coachLessonTabs = [...document.querySelectorAll('[data-coach-lesson-target]')];
const coachLessonPanels = [...document.querySelectorAll('.coach-lesson-panel')];
function showCoachLesson(panelId) {
  coachLessonTabs.forEach(tab => {
    const selected = tab.dataset.coachLessonTarget === panelId;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  coachLessonPanels.forEach(panel => { panel.hidden = panel.id !== panelId; });
}
coachLessonTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showCoachLesson(tab.dataset.coachLessonTarget));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = coachLessonTabs[(index + direction + coachLessonTabs.length) % coachLessonTabs.length];
    showCoachLesson(next.dataset.coachLessonTarget);
    next.focus();
  });
});

document.querySelectorAll('.practice-reveal').forEach(button => {
  button.addEventListener('click', () => {
    const sample = document.getElementById(button.getAttribute('aria-controls'));
    const showing = !sample.hidden;
    sample.hidden = showing;
    button.setAttribute('aria-expanded', String(!showing));
    button.textContent = showing ? 'Show a responsible response' : 'Hide the sample response';
  });
});

const coachMissionInputs = [...document.querySelectorAll('[data-coach-mission]')];
const coachMissionStatus = document.getElementById('coach-mission-status');
const coachMissionMeter = document.getElementById('mission-meter-fill');
const coachMissionStorageKey = 'coachCaseyWeeklyMission';
const missionMessages = [
  'Your week is ready. Choose the smallest useful first action.',
  'Momentum started. Keep the next action simple.',
  'You are building your voice through practice.',
  'Consistency is showing. Keep service at the center.',
  'Almost complete. Finish with an honest weekly review.',
  'Weekly mission complete. Celebrate the work, record the lesson, and plan the next week.'
];
function saveCoachMission() {
  const complete = coachMissionInputs.filter(input => input.checked).length;
  try {
    const state = Object.fromEntries(coachMissionInputs.map(input => [input.dataset.coachMission, input.checked]));
    localStorage.setItem(coachMissionStorageKey, JSON.stringify(state));
  } catch {}
  if (coachMissionMeter) coachMissionMeter.style.width = `${(complete / coachMissionInputs.length) * 100}%`;
  if (coachMissionStatus) coachMissionStatus.textContent = `${complete} of ${coachMissionInputs.length} actions complete. ${missionMessages[complete]}`;
}
if (coachMissionInputs.length) {
  try {
    const savedMission = JSON.parse(localStorage.getItem(coachMissionStorageKey) || '{}');
    coachMissionInputs.forEach(input => { input.checked = Boolean(savedMission[input.dataset.coachMission]); });
  } catch {}
  coachMissionInputs.forEach(input => input.addEventListener('change', saveCoachMission));
  document.getElementById('reset-coach-mission').addEventListener('click', () => {
    coachMissionInputs.forEach(input => { input.checked = false; });
    saveCoachMission();
  });
  saveCoachMission();
}

const habitInputs = [...document.querySelectorAll('[data-client-habit]')];
const habitStatus = document.getElementById('habit-status');
const habitStorageKey = 'coachCaseyClientHabits';
function saveClientHabits() {
  try {
    const state = Object.fromEntries(habitInputs.map(input => [input.dataset.clientHabit, input.checked]));
    localStorage.setItem(habitStorageKey, JSON.stringify(state));
    const complete = habitInputs.filter(input => input.checked).length;
    habitStatus.textContent = `${complete} of ${habitInputs.length} daily anchors complete. Saved on this device.`;
  } catch {
    habitStatus.textContent = 'Your browser did not save the checklist, but you can still use it on this page.';
  }
}
if (habitInputs.length) {
  try {
    const savedHabits = JSON.parse(localStorage.getItem(habitStorageKey) || '{}');
    habitInputs.forEach(input => { input.checked = Boolean(savedHabits[input.dataset.clientHabit]); });
  } catch {}
  habitInputs.forEach(input => input.addEventListener('change', saveClientHabits));
  document.getElementById('reset-client-habits').addEventListener('click', () => {
    habitInputs.forEach(input => { input.checked = false; });
    saveClientHabits();
  });
  saveClientHabits();
}

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
