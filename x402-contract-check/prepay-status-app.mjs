import { classifyObservedPrepayStatus } from './prepay-status.mjs';

const selector = document.getElementById('prepay-http-status');
const output = document.getElementById('prepay-status-result');
const run = document.getElementById('prepay-status-run');

if (selector && output && run) {
  const show = () => {
    const r = classifyObservedPrepayStatus(selector.value);
    const lines = [
      `Observation: HTTP ${r.httpStatus ?? 'invalid'} — ${r.title}`,
      `Category: ${r.code}`,
      r.interpretation,
      `Safe next step: ${r.safeNextStep}`,
      'Payment outcome: not verified. No wallet or network request used.'
    ];
    output.textContent = lines.join('\n');
  };
  run.addEventListener('click', show);
  selector.addEventListener('change', show);
  show();
}
