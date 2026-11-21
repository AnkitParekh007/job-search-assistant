/** Keep in sync with root package.json / tauri.conf.json / market-site RELEASE_VERSION. */
export const APP_NAME = "Job Search Assistant";
export const APP_VERSION = "0.1.3";
/**
 * True only after a packaged build of this exact version passes Gate A smoke.
 * A version bump does not inherit an earlier package's verification.
 */
export const PACKAGING_VERIFIED = false;
