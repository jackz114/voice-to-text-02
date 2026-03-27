import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
    // 告诉构建器这些模块不应该被打包到 Workers bundle 中
    edgeExternals: ["fs", "path", "os", "crypto", "stream", "buffer", "util"]
});
