import type { Plugin } from "vite";

// The header brand, byte-identical to the single line in send/index.html and
// receive/index.html — the inline SVG is what lets the standalone pages keep
// the logo with no external reference. A drift here fails the build (below).
// The mark is lucide's `wrench`, the same icon the Sukkar Toolbox header uses.
const BRAND_INNER =
  '<svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 ' +
  "7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>" +
  "</svg>Sukkar Toolbox";

// Same deal for the breadcrumb: its "All Tools" link points at the hosted
// toolbox, which is exactly the kind of external reference a standalone file
// must not carry. Collapse it to the tool name.
const CRUMBS =
  '<nav class="crumbs" aria-label="Breadcrumb">' +
  '<a href="https://tools.sukkarshop.com/">All Tools</a><span>/</span>' +
  "<strong>QR File Transfer</strong></nav>";

/**
 * A standalone file has no siblings, so links to the other pages are dead ends.
 * Rewrites are exact-match and `required` ones throw when they miss, so editing
 * the markup breaks the build rather than silently shipping broken links.
 */
export function rewriteStandaloneLinks(page: "send" | "receive"): Plugin {
  const rules: { from: string; to: string; required: boolean }[] = [
    {
      // The Send/Receive switcher would be two dead links here; collapse it to
      // the badge naming the one mode this file is. The badge carries its own
      // catalog key so the standalone runtime translation reaches it too.
      from:
        '<nav class="mode-nav" aria-label="Mode" data-i18n-attr="aria-label:chrome.navAriaLabel">' +
        '<a href="../send/" data-i18n="chrome.navSend">Send</a>' +
        '<a href="../receive/" data-i18n="chrome.navReceive">Receive</a></nav>',
      to:
        page === "send"
          ? '<span class="mode-badge" data-i18n="chrome.modeBadgeSend">Send</span>'
          : '<span class="mode-badge" data-i18n="chrome.modeBadgeReceive">Receive</span>',
      required: true,
    },
    {
      from: `<a class="brand" href="../">${BRAND_INNER}</a>`,
      to: `<span class="brand">${BRAND_INNER}</span>`,
      required: true,
    },
    {
      from: CRUMBS,
      to: '<span class="crumbs"><strong>QR File Transfer</strong></span>',
      required: true,
    },
    {
      // The toolbox links in the footer are hosted-only for the same reason.
      from:
        '<nav class="footer-nav" aria-label="Sukkar Toolbox">' +
        '<a href="https://tools.sukkarshop.com/">🛠️ Tools</a>' +
        '<span class="footer-sep">|</span>' +
        '<a href="https://sukkarshop.com" target="_blank" rel="noopener">🏠 Homepage</a></nav>',
      to: "",
      required: true,
    },
    {
      // Leaves the tool name and version, drops the outbound "Powered by".
      from:
        ' · Powered by <a href="https://sukkarshop.com" target="_blank" rel="noopener">sukkarshop.com</a>',
      to: "",
      required: true,
    },
    {
      from: "Open Receive on the other device.",
      to: "Open the standalone receiver on the other device.",
      required: false,
    },
    {
      // …and the catalog key with it, so the runtime translation says the
      // standalone wording rather than putting the hosted sentence back.
      from: 'data-i18n="send.footerHint"',
      to: 'data-i18n="send.footerHintStandalone"',
      required: false,
    },
    {
      // A single file has no siblings to load a favicon from, and leaving the
      // link in would be the one external reference in a page whose whole point
      // is having none.
      from: '<link rel="icon" href="../decimen_logo.svg" type="image/svg+xml" />',
      to: "",
      required: true,
    },
    {
      // Same rule for the home-screen icon: no siblings to load it from.
      from: '<link rel="apple-touch-icon" href="../apple-touch-icon.png" />',
      to: "",
      required: true,
    },
    {
      // Hosted-only: a downloaded artifact should not solicit. The JS-side
      // counterpart is the support.ts → support.inline.ts module swap.
      from:
        ' · <a class="support-link" href="https://buymeacoffee.com/bashalarmist" ' +
        'target="_blank" rel="noopener noreferrer" data-i18n="chrome.footerSupport">♥ support</a>',
      to: "",
      required: true,
    },
  ];
  return {
    name: "rewrite-standalone-links",
    transformIndexHtml(html) {
      for (const { from, to, required } of rules) {
        if (!html.includes(from)) {
          if (required) throw new Error(`standalone link rewrite missed its target: ${from}`);
          continue;
        }
        html = html.replaceAll(from, to);
      }
      return html;
    },
  };
}
