Image Optimization
Next.js has a builtin <Image> component to automatically optimize your images for faster page loads. To enable image optimization, you must either define an image binding or use a custom loader.

Use a Cloudflare Images binding
The Cloudflare adapter provides a Next.js-compatible image optimization API using Cloudflare Images that can be configured with next.config.js.

The IMAGES binding must be defined to enable image optimization:

// wrangler.toml
{
"images": {
"binding": "IMAGES",
},
}
Image optimization can incur additional costs. See Cloudflare Images pricing for details.

Compatibility notes
Only PNG, JPEG, WEBP, AVIF, GIF, and SVG are supported. Unsupported images will be returned unchanged without optimization.
minimumCacheTTL configuration is not supported. All assets (static, local, or remote) are handled as either immutable (cache forever) or not. Except for the immutable attribute, it does not respect the cache behavior set by the Cache-Control header for non-static images.
dangerouslyAllowLocalIP configuration is not supported. Local IP addresses are always allowed if the URL is allowed by the remotePatterns configuration.
Use a custom loader
You first need to enable Cloudflare Images for your zone.

It is strongly advised to restrict the image origins that can be transformed to where your images are hosted, i.e. a R2 bucket.

You then need to configure your Next application to use a custom loader for Cloudflare Images.

Create an image-loader.ts at the root of your application:

// image-loader.ts
import type { ImageLoaderProps } from "next/image";

const normalizeSrc = (src: string) => {
return src.startsWith("/") ? src.slice(1) : src;
};

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
const params = [`width=${width}`];
if (quality) {
params.push(`quality=${quality}`);
}
if (process.env.NODE_ENV === "development") {
// Serve the original image when using `next dev`
return `${src}?${params.join("&")}`;
}
return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(src)}`;
}
This simple loader does not respect Next.js remotePatterns. You should configure the allowed source origins in the dashboard.

You will then need to update your app configuration to use this loader:

// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
// ...
images: {
loader: "custom",
loaderFile: "./image-loader.ts",
},
};

export default nextConfig;
Images using the cloudflare loader are served directly without going through the middleware.

See more details in the Cloudflare Images documentation.
