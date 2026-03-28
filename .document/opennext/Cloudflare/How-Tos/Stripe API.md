Stripe API
When creating a Stripe object, the default http client implementation is based on node:https which is not implemented on Workers.

However you can use an http client based on fetch (FetchHttpClient) via the httpClient option:

import Stripe from "stripe";

const stripe = Stripe(STRIPE_API_KEY, {
// Cloudflare Workers use the Fetch API for their API requests.
httpClient: Stripe.createFetchHttpClient(),
});
