/**
 * Feedback form — star rating, type selection, mailto generation.
 */

import { initializeTooltips } from './ui.js';

let selectedRating = 0;
const APP_VERSION = '3.5.0';

export function initializeFeedbackForm() {
  const stars = document.querySelectorAll('.star');
  const starContainer = document.getElementById('starRating');

  stars.forEach((star, index) => {
    star.setAttribute('tabindex', '0');
    star.setAttribute('role', 'button');
    star.setAttribute('aria-label', `Rate ${index + 1} out of 5 stars`);

    star.addEventListener('click', function () {
      selectedRating = parseInt(this.getAttribute('data-rating'));
      updateStarDisplay();
      updateRatingText();
    });

    star.addEventListener('mouseenter', function () {
      highlightStars(parseInt(this.getAttribute('data-rating')));
    });

    star.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  starContainer.addEventListener('mouseleave', updateStarDisplay);

  // Reset form when modal opens
  document.getElementById('contactModal').addEventListener('show.bs.modal', function () {
    resetFeedbackForm();
    initializeTooltips();
  });
}

function highlightStars(rating) {
  document.querySelectorAll('.star').forEach((star, index) => {
    star.classList.remove('active', 'hover');
    if (index < rating) star.classList.add('hover');
  });
}

function updateStarDisplay() {
  document.querySelectorAll('.star').forEach((star, index) => {
    star.classList.remove('active', 'hover');
    if (index < selectedRating) star.classList.add('active');
  });
}

function updateRatingText() {
  const ratingText = document.getElementById('ratingText');
  const messages = {
    0: 'Click the stars to rate your experience',
    1: '\u2B50 Poor - Needs significant improvement',
    2: '\u2B50\u2B50 Fair - Has room for improvement',
    3: '\u2B50\u2B50\u2B50 Good - Meets expectations',
    4: '\u2B50\u2B50\u2B50\u2B50 Very Good - Exceeds expectations',
    5: '\u2B50\u2B50\u2B50\u2B50\u2B50 Excellent - Outstanding experience!'
  };

  ratingText.textContent = messages[selectedRating];
  ratingText.style.color = selectedRating >= 4 ? '#28a745' :
    selectedRating >= 3 ? '#ffc107' :
    selectedRating >= 1 ? '#fd7e14' : '';
}

export function submitFeedback() {
  const feedbackType = document.getElementById('feedbackType').value;
  const feedbackMessage = document.getElementById('feedbackMessage').value.trim();
  const userInfo = document.getElementById('userInfo').value.trim();
  const submitBtn = document.getElementById('submitFeedbackBtn');

  if (!feedbackMessage) {
    alert('Please enter your feedback message before submitting.');
    document.getElementById('feedbackMessage').focus();
    return;
  }

  const subject = generateEmailSubject(feedbackType, selectedRating);
  const body = generateEmailBody(feedbackType, feedbackMessage, userInfo, selectedRating);
  const mailtoLink = `mailto:caleb.ohara@siemens.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const originalContent = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Opening email...';
  submitBtn.disabled = true;

  setTimeout(() => {
    window.location.href = mailtoLink;

    setTimeout(() => {
      resetFeedbackForm();
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;

      const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
      modal.hide();
      showFeedbackSuccess();
    }, 1000);
  }, 300);
}

function generateEmailSubject(type, rating) {
  const typeLabels = {
    'feature': 'Feature Request',
    'bug': 'Bug Report',
    'improvement': 'Improvement Suggestion',
    'question': 'Question',
    'compliment': 'Compliment',
    'other': 'Feedback'
  };
  const ratingStr = rating > 0 ? ` (${rating}/5 stars)` : '';
  return `EV kWh App - ${typeLabels[type]}${ratingStr}`;
}

function generateEmailBody(type, message, userInfo, rating) {
  const timestamp = new Date().toLocaleString();
  let body = `Hi Caleb,\n\n`;
  if (rating > 0) body += `App Rating: ${rating}/5 stars \u2B50\n`;
  body += `Feedback Type: ${document.getElementById('feedbackType').selectedOptions[0].text}\n\n`;
  body += `Message:\n${message}\n\n`;
  if (userInfo) body += `From: ${userInfo}\n`;
  body += `\n---\n`;
  body += `Sent from: EV kWh Reimbursement App v${APP_VERSION}\n`;
  body += `Timestamp: ${timestamp}\n`;
  body += `User Agent: ${navigator.userAgent}`;
  return body;
}

function resetFeedbackForm() {
  selectedRating = 0;
  updateStarDisplay();
  updateRatingText();
  document.getElementById('feedbackType').value = 'feature';
  document.getElementById('feedbackMessage').value = '';
  document.getElementById('userInfo').value = '';
}

function showFeedbackSuccess() {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
      <i class="bi bi-check-circle-fill"></i> <strong>Thank you!</strong> Your feedback has been prepared for sending.
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentElement) notification.remove();
  }, 5000);
}
