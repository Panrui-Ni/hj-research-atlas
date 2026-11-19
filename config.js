/* Configuration for the public GitHub repository.
 * After publishing, set these values following README.md.
 * Without configuration the atlas works, but commenting and submissions remain in preview mode.
 */
window.HJ_ATLAS_CONFIG = {
  repository: "",  // Example: "your-organization/hj-research-atlas"
  giscus: {
    repoId: "",
    category: "Node Comments",
    categoryId: ""
  },
  ratings: {
    apiBase: "",  // Set to your Cloudflare Worker URL to enable real votes
    turnstileSiteKey: "" // Public Cloudflare Turnstile site key, NOT the secret key
  }
};
