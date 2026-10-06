const config = require('../config');

const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmail(submission, options) {
  const mockFail = config.emailMode === 'mock' && options.mockFail;
  if (config.emailSideEffectFail || mockFail) {
    throw new Error('mock email provider is down');
  }
  console.log(
    `EMAIL sent to owner ${submission.ownerId}: new submission ${submission.id} on widget ${submission.widgetId}`,
  );
}

async function run(submission, options) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await sendEmail(submission, options);
      return;
    } catch (err) {
      console.warn(
        `Notification attempt ${attempt}/${MAX_ATTEMPTS} for submission ${submission.id} failed: ${err.message}`,
      );
      if (attempt < MAX_ATTEMPTS) {
        await sleep(200 * 2 ** (attempt - 1));
      }
    }
  }
  console.error(
    `ALERT: notification for submission ${submission.id} failed after ${MAX_ATTEMPTS} attempts`,
  );
}

function dispatch(submission, options = {}) {
  setImmediate(() => {
    run(submission, options).catch(err => {
      console.error('Notification job crashed', err.message);
    });
  });
}

module.exports = { dispatch };
