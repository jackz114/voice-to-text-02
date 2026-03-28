**name issues
When using the OpenNext adapter, Wrangler processes the worker's code with esbuild, and by default enables the keep-names option. While this is generally useful for debugging, it can cause issues with certain Next.js libraries (e.g. next-themes) that convert scripts to strings. This happens because esbuild introduces a **name function at the top of modules, which may inadvertently appear in the generated script strings. When these strings are evaluated at runtime, the \_\_name function might therefore not be defined, leading to errors logged in the developer console:

Uncaught ReferenceError: **name is not defined
Note that depending on your minification settings, the **name identifier might be minified, making the error message less clear and potentially not explicitly mentioning \_\_name in such cases.

How to fix such issues
To fix the issue you can simply set the keep_names option to false in your wrangler.jsonc file, like in the following example:

{
"$schema": "node_modules/wrangler/config-schema.json",
"main": ".open-next/worker.js",
"name": "my-app",
"keep_names": false,
/_ ... _/
}
One potential drawback of this solution is that, depending on your minification settings, you may lose the ability to view the original function names in debugging tools.

You must use Wrangler version 4.13.0 or later to use this option.
