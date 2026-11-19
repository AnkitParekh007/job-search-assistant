import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Re-bind scroll reveals after each route change. */
export function useReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!reveals.length) return;

    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => {
      el.classList.remove("is-in");
      io.observe(el);
    });

    return () => io.disconnect();
  }, [pathname]);
}
