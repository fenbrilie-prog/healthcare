/* ============================================================
   CHECKBOX HEALTHCARE PAGE : Custom JS
   - ChiliPiper handler (listens for HubSpot form submits, routes to calendar)
   - Ideas Library tab switcher
   - Book a discovery call modal (lazy HubSpot form init)
   - Smooth scroll for in-page anchors
   ============================================================ */

/* ----- ChiliPiper handler ----- */
(function() {
  var cpTenantDomain = "checkbox";
  var cpRouterName = "inbound-router";
  var lead = {};
  var cpHubspotFormIDs = ["ad82bdab-9ec9-4e52-9c1e-690b6137f680"];
  window.addEventListener("message", function (event) {
    if (cpHubspotFormIDs.length > 0 && !cpHubspotFormIDs.includes(event.data.id)) return;
    if (event.data.type === "hsFormCallback") {
      if (event.data.eventName === "onFormSubmit") {
        for (var key in event.data.data) {
          if (Array.isArray(event.data.data[key].value)) {
            event.data.data[key].value = event.data.data[key].value.toString().replaceAll(",", ";");
          }
          lead[event.data.data[key].name] = event.data.data[key].value;
        }
        if (Object.keys(lead).length <= 1) { lead = event.data.data; }
      } else if (event.data.eventName === "onFormSubmitted") {
        if (window.ChiliPiper && typeof ChiliPiper.submit === "function") {
          ChiliPiper.submit(cpTenantDomain, cpRouterName, { map: true, lead: lead });
        }
        if (window.pagenavattic && typeof pagenavattic.identify === "function") {
          pagenavattic.identify({ email: lead.email });
        }
      }
    }
  });
})();

/* ----- Namespace JS: tabs, modal, smooth scroll ----- */
(function() {
  /* ===== Tab switcher ===== */
  var cats = document.querySelectorAll('.cbx-hc__wf-cat');
  var panels = document.querySelectorAll('.cbx-hc__wf-panel');
  if (cats.length && panels.length) {
    cats.forEach(function(cat) {
      cat.style.cursor = 'pointer';
      cat.addEventListener('click', function() {
        var tab = cat.getAttribute('data-tab');
        cats.forEach(function(c) { c.classList.remove('cbx-hc__wf-cat--active'); });
        cat.classList.add('cbx-hc__wf-cat--active');
        panels.forEach(function(p) {
          if (p.getAttribute('data-panel') === tab) {
            p.classList.add('cbx-hc__wf-panel--active');
          } else {
            p.classList.remove('cbx-hc__wf-panel--active');
          }
        });
      });
    });
  }

  /* ===== Book a discovery call modal ===== */
  var modal = document.getElementById('cbx-hc-modal-book');
  var openers = document.querySelectorAll('[data-cbx-open-book]');
  var closers = document.querySelectorAll('[data-cbx-close-book]');
  var hubspotFormMounted = false;

  function mountHubspotForm() {
    if (hubspotFormMounted) return;
    if (!(window.hbspt && window.hbspt.forms && typeof window.hbspt.forms.create === 'function')) {
      setTimeout(mountHubspotForm, 200);
      return;
    }
    hbspt.forms.create({
      region: "na1",
      portalId: "4351004",
      formId: "ad82bdab-9ec9-4e52-9c1e-690b6137f680",
      target: "#cbx-hc-hubspot-form",
      onFormSubmit: function($form) {
        try {
          var fname = $form[0].fullName ? $form[0].fullName.value : '';
          var email = $form[0].email ? $form[0].email.value : '';
          if (window.navattic && typeof window.navattic.identify === 'function') {
            window.navattic.identify({
              'user.fullName': fname,
              'user.email': email
            });
          }
        } catch (err) { /* swallow */ }
      }
    });
    hubspotFormMounted = true;
  }

  function openModal() {
    if (!modal) return;
    modal.classList.add('cbx-hc__modal--open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cbx-hc-modal-locked');
    mountHubspotForm();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('cbx-hc__modal--open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cbx-hc-modal-locked');
  }

  openers.forEach(function(opener) {
    opener.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
  });
  closers.forEach(function(closer) {
    closer.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('cbx-hc__modal--open')) {
      closeModal();
    }
  });

  /* ===== Smooth scroll for in-page anchors ===== */
  var anchors = document.querySelectorAll('.cbx-hc a[href^="#"]:not([data-cbx-open-book])');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  anchors.forEach(function(link) {
    link.addEventListener('click', function(e) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
