"Your Worker exceeded the size limit of 3 MiB"
The Cloudflare Account you are deploying to is on the Workers Free plan, which limits the size of each Worker to 3 MiB. When you subscribe to the Workers Paid plan, each Worker can be up to 10 MiB.

When deploying your Worker, wrangler will show both the original and compressed sizes. Only the latter (gzipped size) matters for these limits.

"Your Worker exceeded the size limit of 10 MiB"
If your Worker is larger than 10 MiB compressed — there might be unnecessary code ending up in your production bundle. You can visualize and understand this by running:

npx @opennextjs/cloudflare build within your project's root directory
cd .open-next/server-functions/default to open the directory that contains the bundled code
Take the file named handler.mjs.meta.json and use the ESBuild Bundle Analyzer to visualize your application's code, and understand the largest parts of your production bundle
My app fails to build when I import a specific NPM package
First, make sure that the nodejs_compat compatibility flag is enabled, and your compatibility date is set to on or after "2024-09-23", in your wrangler configuration file. Refer to the Node.js Workers docs for more details on Node.js support in Cloudflare Workers.

Some NPM packages define multiple exports. For example:

"exports": {
"other": "./src/other.js",
"node": "./src/node.js",
"browser": "./src/browser.js",
"default": "./src/default.js"
},
When you use @opennextjs/cloudflare, Wrangler bundles your code before running it locally, or deploying it to Cloudflare. Wrangler has to choose which export to use, when you import a module. By default, Wrangler, which uses esbuild, handles this in a way that is not compatible with some NPM packages.

You may want to modify how Wrangler resolves multiple exports, such that when you import packages, the node export, if present, is used. You can do do by defining the following variables in a .env file within the root directory of your Next.js app:

WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
Error: Cannot perform I/O on behalf of a different request.
Some DB clients (i.e. postgres) create a connection to the DB server when they are first instantiated and re-use it for later requests. This programming model is not compatible with the Workers runtime where a connection can not be re-used in a different request.

The following error is generated in such a case:

⨯ Error: Cannot perform I/O on behalf of a different request. I/O objects (such as streams, request/response bodies, and others) created in the context of one request handler cannot be accessed from a different request's handler. This is a limitation of Cloudflare Workers which allows us to improve overall performance. (I/O type: Writable)
To solve this, you should create the DB client inside a request context and not keep a global DB client.

A global client would not work:

// src/lib/db.ts
import postgres from "postgres";

// `client` is global.
// As the connection would be shared across requests, it fails on worker
export const client = postgres(process.env.DATABASE_URL, { max: 5 });

// src/app/api/route.ts
import { client } from "@/db/db";

export const dynamic = "force-dynamic";

export async function GET() {
return new Response(JSON.stringify(await client`SELECT * FROM users;`));
}
It can fixed by creating the client for each incoming request:

// src/app/api/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
// The client is created for each incoming request and no connection is shared across requests
const client = postgres(process.env.DATABASE_URL, { max: 5 });
return new Response(JSON.stringify(await client`SELECT * FROM users;`));
}
Error: Failed to load chunk server/chunks/ssr/<chunk_name>.js
If you see an error similar to:

✘ [ERROR] ⨯ Error: Failed to load chunk server/chunks/ssr/<chunk_name>.js
at loadChunkPath
(...)
at Object.loadChunk
(...)
at .open-next/server-functions/default/.next/server/app/page.js
You are likely using an older version of the OpenNext adapter with Turbopack builds. Please upgrade @opennextjs/cloudflare to the latest version for Turbopack support, or use Webpack builds.

X [ERROR] Could not resolve "<package>"
When you see the following error during the build:

⚙️ Bundling the OpenNext server...
X [ERROR] Could not resolve "<package name>"
It might be because the package contains workerd specific code.

Check this howto for a solution.

ReferenceError: FinalizationRegistry is not defined
If you encounter this error when using features that rely on modern JavaScript APIs:

✘ [ERROR] ⨯ ReferenceError: FinalizationRegistry is not defined
This error occurs because the FinalizationRegistry API is not available in older Cloudflare Workers compatibility dates.

To fix this issue, update your compatibility_date in wrangler.toml or wrangler.jsonc to 2025-05-05 or later:

{
"compatibility_date": "2025-05-05"
}
Refer to the Cloudflare Workers compatibility flags documentation for more details.
