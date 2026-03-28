Environment variables
This entry describe the most sensible way to handle your environment variables which works well both during local development and once your application is deployed to Cloudflare Workers.

On the Cloudflare platform, your environment variables can be stored in either "Environment variables" or "Secrets". The difference being that Secrets can not be read back from either the dashboard or the CLI after being created.

Local development
While there are multiple ways to set environment variables for local development on the Cloudflare platform (adding them to to your wrangler configuration or to a .dev.vars file) that does not play well with the recommended development workflow as they would not be available while using next dev.

What you should do instead is to use the Next.js .env files. By doing so the environment variables will be available on process.env both while running next dev and when running your app locally on a Worker with wrangler dev.

Next.js .env files are environment specific. That is a .env.development will take precedence over a .env file when you use the "development" environment. See the Next.js site for a detailed explanation of the loading order.

You should use the NEXTJS_ENV environment variable to select the environment to use when running your app locally on a worker, that's how you would select the "development" environment:

# .dev.vars

NEXTJS_ENV=development
The "production" environment is used by default when NEXTJS_ENV is not explicitly set.

Production
.env and .dev.vars are local files that should not be added to source control. You should instead use the Cloudflare dashboard to set your environment variables for production.

Workers Builds
When you use Workers Builds to deploy your application, the environment variables must be set in the "Build variables and secrets".

By settings the "Build variables and secrets", the Next build executed by Workers Builds will have access to the environment variables. It needs that access to inline the NEXT*PUBLIC*... variables and access non-NEXT*PUBLIC*... variables needed for SSG pages.

Runtime variables
Your Next application needs to access environment variables at runtime. You should always set the runtime environment variables in the Cloudflare dashboard

If you set environment variables from the dashboard, you can use the --keep-vars option of wrangler to prevent them from being deleted by deployments, i.e. opennextjs-cloudflare deploy -- --keep-vars
