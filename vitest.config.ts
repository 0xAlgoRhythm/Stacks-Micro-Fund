import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  ssr: {
    // Bundle clarinet SDK dependencies to avoid CommonJS named export issues
    noExternal: ["@stacks/clarinet-sdk", "@stacks/clarinet-sdk-wasm"],
  },
});
