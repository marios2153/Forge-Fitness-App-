// Stripe billing for Forge Premium subscriptions. Mirrors mailer.js's pattern: the SDK client
// is only created when a secret key is configured, so the rest of the server can run (and the
// free parts of the app can be used) before Stripe is set up — see .env.example.
const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

function isConfigured() {
  return !!stripe;
}

function priceIdForPlan(plan) {
  return PRICE_IDS[plan] || null;
}

// The reverse lookup: a webhook only tells us which Stripe price a subscription is on, and
// the client only ever needs to know "monthly" or "yearly" to render itself.
function planForPriceId(priceId) {
  return Object.keys(PRICE_IDS).find((plan) => PRICE_IDS[plan] === priceId) || null;
}

module.exports = { stripe, isConfigured, priceIdForPlan, planForPriceId };
