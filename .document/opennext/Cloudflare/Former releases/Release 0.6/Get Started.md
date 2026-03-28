Get Started
New apps
To create a new Next.js app, pre-configured to run on Cloudflare using @opennextjs/cloudflare, run:

npm create cloudflare@latest -- my-next-app --framework=next --experimental
Existing Next.js apps

1. Install @opennextjs/cloudflare
   First, install @opennextjs/cloudflare:

npm install --save-dev @opennextjs/cloudflare@latest 2. Install Wrangler
Install the Wrangler CLI as a devDependency:

npm install --save-dev wrangler@latest
You must use Wrangler version 3.99.0 or later to deploy Next.js apps using @opennextjs/cloudflare.

3. Create a wrangler configuration file
   This step is optional since @opennextjs/cloudflare creates this file for you during the build process (if not already present).

A wrangler configuration file is needed for your application to be previewed and deployed, it is also where you configure your Worker and define what resources it can access via bindings.

You can create one yourself in the root directory of your Next.js app with the name wrangler.toml and the following content:

{
"$schema": "node_modules/wrangler/config-schema.json",
"main": ".open-next/worker.js",
"name": "my-app",
"compatibility_date": "2024-12-30",
"compatibility_flags": ["nodejs_compat"],
"assets": {
"directory": ".open-next/assets",
"binding": "ASSETS",
},
"services": [
{
"binding": "WORKER_SELF_REFERENCE",
// The service should match the "name" of your worker
"service": "my-app",
},
],
"kv_namespaces": [
// Create a KV binding with the binding name "NEXT_INC_CACHE_KV"
// to enable the KV based caching:
// {
// "binding": "NEXT_INC_CACHE_KV",
// "id": "<BINDING_ID>"
// }
],
}
As shown above: - You must enable the nodejs_compat compatibility flag and set your compatibility date to 2024-09-23 or later, in order for your Next.js app to work with @opennextjs/cloudflare - The main and assets values should also not be changed unless you modify the build output result in some way - You can add a binding named NEXT_INC_CACHE_KV to make use of Next.js' caching as described in the Caching docs

4. Add an open-next.config.ts file
   This step is optional since @opennextjs/cloudflare creates this file for you during the build process (if not already present).

Add a open-next.config.ts file to the root directory of your Next.js app:

import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

export default defineCloudflareConfig({
incrementalCache: kvIncrementalCache,
});
To use the OpenNextConfig type as illustrated above (which is not necessary), you need to install the @opennextjs/aws NPM package as a dev dependency.

5. Add a .dev.vars file
   Then, add a .dev.vars file to the root directory of your Next.js app:

NEXTJS_ENV=development
The NEXTJS_ENV variable defines the environment to use when loading Next.js .env files. It defaults to "production" when not defined.

6. Update the package.json file
   Add the following to the scripts field of your package.json file:

"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
npm run preview: Builds your app and serves it locally, allowing you to quickly preview your app running locally in the Workers runtime, via a single command.
npm run deploy: Builds your app, and then deploys it to Cloudflare
cf-typegen: Generates a cloudflare-env.d.ts file at the root of your project containing the types for the env. 7. Add caching with Workers KV
See the Caching docs for information on enabling Next.js caching in your OpenNext project.

8. Remove any export const runtime = "edge"; if present
   Before deploying your app, remove the export const runtime = "edge"; line from any of your source files.

The edge runtime is not supported yet with @opennextjs/cloudflare.

9. Add .open-next to .gitignore
   You should add .open-next to your .gitignore file to prevent the build output from being committed to your repository.

10. Remove @cloudflare/next-on-pages (if necessary)
    If your Next.js app currently uses @cloudflare/next-on-pages, you'll want to remove it, and make a few changes.

Uninstalling the @cloudflare/next-on-pages package as well as the eslint-plugin-next-on-pages package if present.

Remove any reference of these packages from your source and configuration files. This includes:

setupDevPlatform() calls in your Next.js config file
getRequestContext imports from @cloudflare/next-on-pages from your source files (those can be replaced with getCloudflareContext calls from @opennextjs/cloudflare)
next-on-pages eslint rules set in your Eslint config file 11. Develop locally
You can continue to run next dev when developing locally.

Modify your Next.js configuration file to import and call the initOpenNextCloudflareForDev utility from the @opennextjs/cloudflare package. This makes sure that the Next.js dev server can optimally integrate with the open-next cloudflare adapter and it is necessary for using bindings during local development.

This is an example of a Next.js configuration file calling the utility:

// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
/_ config options here _/
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
After having added the initOpenNextCloudflareForDev() call in your Next.js configuration file, you will be able, during local development, to access in any of your server code, local versions of Cloudflare bindings as indicated in the bindings documentation.

In step 3, we also added the npm run preview, which allows you to quickly preview your app running locally in the Workers runtime, rather than in Node.js. This allows you to test changes in the same runtime as your app will run in when deployed to Cloudflare.

12. Deploy to Cloudflare Workers
    Either deploy via the command line:

npm run deploy
Or connect a GitHub or GitLab repository, and Cloudflare will automatically build and deploy each pull request you merge to your production branch.
