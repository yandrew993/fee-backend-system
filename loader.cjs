// loader.cjs
import { readFile } from "fs/promises";
import { pathToFileURL } from "url";

/**
 * Custom loader to allow ES module support
 * in environments that expect CommonJS.
 */
export async function load(url, context, defaultLoad) {
  if (url.endsWith(".js") || url.endsWith(".mjs")) {
    const source = await readFile(new URL(url), "utf8");

    return {
      format: "module",
      source,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
