import * as paypal from '@paypal/checkout-server-sdk';

export class PayPalConfig {
  static environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    // Use sandbox for testing, live for production
    if (process.env.NODE_ENV === 'production') {
      return new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
      return new paypal.core.SandboxEnvironment(clientId, clientSecret);
    }
  }

  static client() {
    return new paypal.core.PayPalHttpClient(this.environment());
  }
}