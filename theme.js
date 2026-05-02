/* theme.js — Chuck's AI v7
   Load this as the FIRST script in <head> (before any CSS that depends on body class).
   Reads localStorage and applies .light immediately — eliminates flash on page load.
   Dark mode is the default.
*/
(function () {
  const stored = localStorage.getItem('cai_theme');
  // Default is dark — only add .light if explicitly set
  if (stored === 'light') {
    document.documentElement.classList.add('light');
  }

  // Mirror class on <body> once DOM is ready (some CSS targets body.light)
  function syncBody() {
    if (document.documentElement.classList.contains('light')) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncBody);
  } else {
    syncBody();
  }

  // Public API — nav and any page can call these
  window.CAI = window.CAI || {};

  window.CAI.setTheme = function (mode) {
    const isLight = mode === 'light';
    document.documentElement.classList.toggle('light', isLight);
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('cai_theme', mode);
    // Dispatch event so any page component can react
    document.dispatchEvent(new CustomEvent('cai:themechange', { detail: { mode } }));
  };

  window.CAI.toggleTheme = function () {
    const current = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    window.CAI.setTheme(current === 'light' ? 'dark' : 'light');
  };

  window.CAI.getTheme = function () {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  };
})();
