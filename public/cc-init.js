// Installs kit component clicks (dead-component detection) with CDE's config. Loaded as a module by every static
// page (scripts/generate-seo-pages.js writePage) and by the SPA's index.html, so there is one install per page load
// and no React effect to double-mount. Instrumentation only: nothing on the page changes.
import { installFromConfig } from './component-clicks.js';
import { CC_CONFIG, NAV_VIEWS, PLAY_BLOCKS } from './cc-config.js';

try {
  const root = document.getElementById('root');
  if (root) {
    // SPA: quiz screens keep the URL they started from (/app), so mute #root unless the current view is navigation.
    // The kit skips anything inside [data-c-ignore]; a view change re-renders #root, which triggers its rescan.
    const gate = () => {
      const v = document.documentElement.getAttribute('data-view') || '';
      if (NAV_VIEWS.has(v)) root.removeAttribute('data-c-ignore');
      else root.setAttribute('data-c-ignore', '');
    };
    gate();
    new MutationObserver(gate).observe(document.documentElement, { attributes: true, attributeFilter: ['data-view'] });
  } else {
    for (const el of document.querySelectorAll(PLAY_BLOCKS)) el.setAttribute('data-c-ignore', '');
  }
  installFromConfig(CC_CONFIG);
} catch (e) { /* never break the page */ }
