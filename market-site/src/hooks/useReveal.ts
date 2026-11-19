import { useEffect } from "react";

const REVEAL = ".reveal";

/**
 * Scroll reveals that cannot strand content.
 *
 * - Content is visible by default; `.reveal` only hides once `html.reveal-ready`
 *   is set (in index.html), and a CSS animation fallback forces it visible after
 *   a short delay even if this hook never runs.
 * - A MutationObserver picks up `.reveal` elements mounted after the first pass
 *   (async data, route changes, remounts), so nothing is left unobserved.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || reduced) {
      root.classList.remove("reveal-ready");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );

    const watch = (el: Element) => {
      if (!el.classList.contains("is-in")) io.observe(el);
    };

    document.querySelectorAll(REVEAL).forEach(watch);
    root.classList.add("reveal-live");

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(REVEAL)) watch(node);
          node.querySelectorAll(REVEAL).forEach(watch);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      root.classList.remove("reveal-live");
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
