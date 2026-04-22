(function () {
  const header = document.getElementById("site-header");
  const toggle = document.querySelector(".nav-toggle");
  const mobile = document.getElementById("nav-mobile");

  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      if (open) {
        mobile.hidden = true;
      } else {
        mobile.hidden = false;
      }
    });
    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        mobile.hidden = true;
      });
    });
  }

  if (header) {
    const onScroll = function () {
      if (window.scrollY > 8) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---------- multi-step estimate form ----------
  const form = document.getElementById("estimate-form");
  if (!form) return;

  const steps = form.querySelectorAll(".estimate-step");
  const progressBar = document.getElementById("estimate-progress-bar");
  const totalInputSteps = 3;
  let currentStep = 1;

  const showStep = function (step) {
    currentStep = step;
    steps.forEach(function (el) {
      const s = Number(el.dataset.step);
      el.classList.toggle("is-active", s === step);
    });
    const visual = Math.min(step, totalInputSteps);
    if (progressBar) progressBar.style.width = (visual / totalInputSteps) * 100 + "%";
    const active = form.querySelector(".estimate-step.is-active");
    if (active) {
      const firstField = active.querySelector("input:not([type=radio]), select");
      if (firstField) setTimeout(function () { firstField.focus(); }, 60);
      active.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const validateStep = function (step) {
    const panel = form.querySelector('.estimate-step[data-step="' + step + '"]');
    if (!panel) return true;
    const fields = panel.querySelectorAll("input[required], select[required]");
    let ok = true;
    fields.forEach(function (field) {
      const valid = field.checkValidity() && String(field.value || "").trim() !== "";
      if (!valid) {
        ok = false;
        field.classList.add("is-invalid");
        const clear = function () { field.classList.remove("is-invalid"); };
        field.addEventListener("input", clear, { once: true });
        field.addEventListener("change", clear, { once: true });
      }
    });
    if (!ok) {
      const firstBad = panel.querySelector(".is-invalid");
      if (firstBad) firstBad.focus();
    }
    return ok;
  };

  form.querySelectorAll("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = Number(btn.dataset.next);
      if (validateStep(currentStep)) showStep(target);
    });
  });
  form.querySelectorAll("[data-prev]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(Number(btn.dataset.prev));
    });
  });

  const SUBMIT_URL = "https://castro-estimate-api.vercel.app/api/submit";

  const errorNode = document.getElementById("estimate-error");
  const showError = function (msg) {
    if (!errorNode) return;
    errorNode.textContent = msg;
    errorNode.hidden = false;
  };
  const clearError = function () {
    if (!errorNode) return;
    errorNode.hidden = true;
    errorNode.textContent = "";
  };

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateStep(3)) return;
    clearError();

    const submitBtn = document.getElementById("estimate-submit");
    const originalLabel = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>Sending…</span>";
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      first_name: String(data.first_name || "").trim(),
      last_name:  String(data.last_name  || "").trim(),
      email:      String(data.email      || "").trim(),
      phone:      String(data.phone      || "").trim(),
      address:    String(data.address    || "").trim(),
      service_type: data.service_type || "",
      frequency:    data.frequency    || "",
      area_size:    data.area_size    || "",
      website:      data.website      || ""
    };

    try {
      const r = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await r.json().catch(function () { return {}; });
      if (!r.ok || !result.ok) {
        throw new Error(result.error || "Request failed (" + r.status + ")");
      }
      showStep(4);
    } catch (err) {
      console.error("Estimate submit failed:", err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
      showError("Something went wrong sending your request. Please try again, or email us directly at info@castropristineclean.com.");
    }
  });
})();
