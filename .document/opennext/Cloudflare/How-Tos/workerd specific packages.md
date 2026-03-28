workerd specific code
Configuration
workerd is the runtime cloudflare uses to run Workers code.

While the nodejs_compat flag makes workerd mostly compatible with Node.js, there are still minor differences. Some packages publish code for different runtimes to account for those differences. For example, postgres has conditional exports in its package.json:

"exports": {
"types": "./types/index.d.ts",
"bun": "./src/index.js",
"workerd": "./cf/src/index.js",
"import": "./src/index.js",
"default": "./cjs/src/index.js"
},
With such exports, Node.js applications use either src/index.js or cjs/src/index.js depending if the app use ESM or CJS.

However we want to use the workerd specific entrypoint when using the Cloudflare adapter. For that, you need to instruct Next.js not to bundle packages as it would use the node conditions by default.

To do that, add those packages in the serverExternalPackages key of your next.config.ts:

// node.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
serverExternalPackages: ["@prisma/client", ".prisma/client", "postgres"],
};

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

export default nextConfig;
Packages known to have workerd specific code
@libsql/isomorphic-ws
@prisma/client (and the generated .prisma/client)
jose
postgres
react-textarea-autosize
Please report an issue on the adapter GH repository to have packages added to this list.
