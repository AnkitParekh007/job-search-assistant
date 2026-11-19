import { describe, expect, it } from "vitest";
import { WORKFLOWS, PRODUCT_FEATURES } from "@ai-job-search/core";

describe("shared core wiring", () => {
  it("exposes workflows and marketing features", () => {
    expect(WORKFLOWS.length).toBeGreaterThan(10);
    expect(PRODUCT_FEATURES.length).toBeGreaterThan(5);
  });
});
