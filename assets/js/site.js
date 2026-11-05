/* Clafina marketing site — a few behaviours, no dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* --- Header: a hairline appears once the page moves ------------------- */
  var header = document.getElementById("header");

  if (header) {
    var setScrolled = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  /* --- Mobile navigation ------------------------------------------------ */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");

  if (toggle && nav) {
    var iconUse = toggle.querySelector("use");

    var setNav = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (iconUse) {
        iconUse.setAttribute("href", open ? "#i-close" : "#i-menu");
      }
    };

    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setNav(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setNav(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) {
        setNav(false);
      }
    });
  }

  /* --- Reveal on scroll ------------------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");

  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );

      revealables.forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  /* --- Footer year ------------------------------------------------------ */
  var year = document.getElementById("year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* --- Demo request form ------------------------------------------------ */
  var form = document.getElementById("demoForm");

  if (form) {
    var success = document.getElementById("formSuccess");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var markInvalid = function (field, invalid) {
      var wrapper = field.closest(".field");
      if (wrapper) {
        wrapper.classList.toggle("is-invalid", invalid);
      }
      field.setAttribute("aria-invalid", String(invalid));
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;

      Array.prototype.forEach.call(form.elements, function (field) {
        if (!field.name) {
          return;
        }

        var value = (field.value || "").trim();
        var required = field.hasAttribute("required");
        var invalid = false;

        if (required && !value) {
          invalid = true;
        } else if (field.type === "email" && value && !emailPattern.test(value)) {
          invalid = true;
        }

        markInvalid(field, invalid);

        if (invalid && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // No backend is wired yet: show the confirmation the site will use once
      // the form posts to a CRM or a form endpoint. See README.md.
      if (success) {
        success.hidden = false;
        success.focus();
      }

      form.reset();
    });

    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) {
        return;
      }

      field.addEventListener("input", function () {
        if (field.closest(".field")?.classList.contains("is-invalid")) {
          markInvalid(field, false);
        }
      });
    });
  }
})();
