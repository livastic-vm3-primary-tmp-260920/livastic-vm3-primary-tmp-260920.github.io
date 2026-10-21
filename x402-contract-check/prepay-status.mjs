/**
 * Original read-only merchant prepayment HTTP status triage.
 * The status is manually supplied, not fetched. No wallet, credentials, network or signatures.
 * These are observations about a single response, NOT verdicts on a merchant or a payment.
 */
const R = Object.freeze({
  400: ['REQUEST_NOT_READY', 'Request rejected before a payment challenge',
    'A 400 may describe malformed or unsupported input. It is not an observed x402 payment failure.',
    'Compare the public API request schema and an authorized synthetic request. Never expose private payloads.'],
  401: ['AUTH_REQUIRED', 'Authentication required',
    'This response is not an x402 payment quote. Authentication may be required before payment evaluation.',
    'Use only your own permitted public documentation; do not send tokens to a diagnostic site.'],
  402: ['PAYMENT_CHALLENGE_POSSIBLE', 'Payment required — inspect the actual quote',
    'An HTTP 402 can contain an x402 PaymentRequired challenge, but status alone does not prove a valid quote, merchant identity or successful payment.',
    'Inspect ONLY the public, unsigned PAYMENT-REQUIRED value with the free checker above.'],
  403: ['ACCESS_FORBIDDEN', 'Request not authorized',
    'This response indicates access was refused; it is not evidence that a wallet payment failed.',
    'Check documented access requirements and permitted scope; do not bypass the restriction.'],
  404: ['ROUTE_NOT_FOUND', 'Route unavailable or not found',
    'A 404 from this request is not an x402 payment decision.',
    'Verify the intended public method/path from the service documentation.'],
  408: ['REQUEST_TIMED_OUT', 'Request timed out',
    'The HTTP layer reported a timeout; whether payment was required or settled is unknown.',
    'Inspect public retry guidance. Do not retry any already-signed payment automatically.'],
  409: ['REQUEST_CONFLICT', 'Request conflict',
    'A conflict is not evidence of a failed x402 transfer or a valid quote.',
    'Check the public state/idempotency contract before choosing any next action.'],
  422: ['INPUT_SEMANTICS_REJECTED', 'Request semantically rejected before payment',
    'A 422 may reflect input validation or a business-rule mismatch. It does not by itself establish that payment was attempted or failed.',
    'Check the public input schema and compare a fictional accepted shape. No payment retry is implied.'],
  429: ['RATE_LIMITED', 'Rate limit or quota reached',
    'The endpoint limited requests; no payment acceptance or failure can be inferred from this response.',
    'Respect backoff instructions and published usage limits. Never use alternate identities to bypass them.']
});

function result(httpStatus, code, title, interpretation, safeNextStep) {
  return Object.freeze({
    httpStatus, code, title, interpretation, safeNextStep,
    paymentSucceeded: 'NOT_VERIFIED',
    paymentFailed: 'NOT_VERIFIED',
    merchantTrustworthy: 'NOT_VERIFIED',
    walletAccessRequired: false,
    networkCallsMade: 0
  });
}

export function classifyObservedPrepayStatus(status) {
  const s = String(status ?? '').trim();
  if (!/^[1-5][0-9][0-9]$/.test(s)) {
    return result(null, 'INVALID_HTTP_STATUS', 'Select a complete HTTP status (100–599)',
      'This checker accepts a status only, never a URL, request body, header or customer data.',
      'Choose one HTTP code seen in an already-completed, authorized public/synthetic request.');
  }
  const code = Number(s);
  if (R[code]) return result(code, ...R[code]);
  if (code < 200) return result(code, 'INFORMATIONAL_ONLY', 'Informational response',
    'A 1xx response is not the final result of a request or a proof of a payment.',
    'Review the final publicly observable HTTP response code without sharing credentials.');
  if (code < 300) return result(code, 'HTTP_SUCCESS_NOT_PAYMENT_PROOF', 'HTTP response successful',
    'A 2xx response may be from a free resource or a valid request; status alone cannot prove a payment or settlement.',
    'Verify paid service delivery and the authoritative settlement receipt separately.');
  if (code < 400) return result(code, 'REDIRECT_NOT_PAYMENT', 'Redirect, not a payment decision',
    'A 3xx redirect does not establish x402 quote validity, acceptance or transfer settlement.',
    'Check the intended public endpoint; do not follow untrusted redirects with credentials.');
  if (code < 500) return result(code, 'CLIENT_OR_REQUEST_EXCEPTION', 'Request not completed',
    'This 4xx response is not automatically an x402 payment failure or a valid quote.',
    'Review the endpoint-specific public error contract with a fictional example.');
  return result(code, 'UPSTREAM_OR_SERVER_ERROR', 'Server-side response error',
    'A 5xx response means the request was not fulfilled normally. Status alone does not establish whether any earlier payment settled.',
    'Do not repeat a signed purchase automatically. Reconcile any actual independent payment receipt first.');
}
