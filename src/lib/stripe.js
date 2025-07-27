import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';

export const stripePromise = loadStripe(stripePublishableKey);

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    credits: 5,
    features: [
      '5 repurposings/month',
      '1 upload at a time',
      'Limited formats',
      'Watermarked content'
    ]
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    credits: 500,
    features: [
      '500 repurposings/month',
      'Unlimited uploads',
      'All formats included',
      'Priority LLM queue',
      'Email support'
    ]
  },
  business: {
    name: 'Business',
    price: 99,
    priceId: 'price_business_monthly',
    credits: 2500,
    features: [
      '2500 repurposings/month',
      'RSS/Notion integration',
      'API access',
      'Team support (up to 5 users)',
      'White-labeled exports',
      'Live chat support'
    ]
  }
};

export const createCheckoutSession = async (priceId, userId) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        successUrl: `${window.location.origin}/#/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/#/billing?canceled=true`,
      }),
    });

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};