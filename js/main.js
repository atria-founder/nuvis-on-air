/* Nuvis On Air — interacción mínima: piloto ON AIR, menú móvil y formularios. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. El piloto ON AIR se enciende al cargar y arranca el contador de grabación.
  var lamp = document.querySelector("[data-lamp]");
  var rec = document.querySelector("[data-rec]");
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function startRec() {
    if (!rec) return;
    var t0 = Date.now();
    var tick = function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      rec.textContent = "REC " + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }
  if (lamp) {
    var on = function () { lamp.classList.add("is-on"); lamp.setAttribute("aria-label", lamp.dataset.onLabel || "On air"); startRec(); };
    if (reduce) { on(); } else { setTimeout(on, 650); }
  }

  // 2. Menú móvil.
  var toggle = document.querySelector("[data-menu-toggle]");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  // 3. Formularios: envían a un endpoint (Formspree, Web3Forms, Getform…) definido en data-endpoint.
  //    Sin endpoint configurado, muestran el email de contacto para escribir directamente.
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var status = form.querySelector("[data-status]");
    var msgs = {
      sending: form.dataset.msgSending || "Enviando…",
      ok: form.dataset.msgOk || "Recibido.",
      error: form.dataset.msgError || "No se ha podido enviar.",
      noEndpoint: form.dataset.msgNoEndpoint || ""
    };
    function show(state, text) { if (!status) return; status.dataset.state = state; status.textContent = text; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var endpoint = form.dataset.endpoint;
      var data = new FormData(form);
      if (!endpoint) { show("error", msgs.noEndpoint); return; }
      show("sending", msgs.sending);
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          var email = data.get("email") || "";
          show("ok", msgs.ok.replace("{email}", email));
          form.reset();
        })
        .catch(function () { show("error", msgs.error); });
    });
  });

  // 4. Botones de copiar (email / teléfono).
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      var done = function () { var t = btn.textContent; btn.textContent = btn.dataset.copied || "Copiado"; setTimeout(function () { btn.textContent = t; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(function () {});
      }
    });
  });
})();
