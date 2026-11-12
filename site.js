/* Date and schedule logic. Everyday edits go in content.js, not here. */
(function (root) {
  "use strict";

  var ORD = ["", "1st", "2nd", "3rd", "4th", "5th"];

  // Today's date in Hawaii, as a UTC timestamp at midnight.
  function hawaiiToday(now) {
    var p = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Honolulu", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(now || new Date()).split("-").map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }

  // "2026-12-27" -> timestamp, or null if it is not a real date.
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    var ts = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return new Date(ts).getUTCMonth() === +m[2] - 1 ? ts : null;
  }

  function toISO(ts) { return new Date(ts).toISOString().slice(0, 10); }

  // The nth Sunday of a month (month may overflow past 11). Null if it does not exist.
  function nthSunday(y, m, n) {
    var first = new Date(Date.UTC(y, m, 1));
    var target = first.getUTCMonth();
    var dow = first.getUTCDay();
    var ts = Date.UTC(first.getUTCFullYear(), target, 1 + ((7 - dow) % 7) + (n - 1) * 7);
    return new Date(ts).getUTCMonth() === target ? ts : null;
  }

  // [2, 4] -> "2nd and 4th Sundays"
  function describeSundays(nths) {
    var names = (nths || []).map(function (n) { return ORD[n] || (n + "th"); });
    if (!names.length) return "";
    var s = names.length === 1
      ? names[0]
      : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    return s + (names.length === 1 ? " Sunday" : " Sundays");
  }

  // Every upcoming service: regular Sundays + extra services, with cancellations marked.
  function buildUpcoming(cfg, today, monthsAhead) {
    var out = [];
    var base = new Date(today);
    var y = base.getUTCFullYear(), m0 = base.getUTCMonth();
    var months = monthsAhead || 6;

    (cfg.temples || []).forEach(function (t) {
      (t.sundays || []).forEach(function (n) {
        for (var i = 0; i <= months; i++) {
          var ts = nthSunday(y, m0 + i, n);
          if (ts !== null && ts >= today) {
            out.push({ ts: ts, temple: t.name, time: t.time, note: "", cancelled: false, extra: false });
          }
        }
      });
    });

    (cfg.extra || []).forEach(function (e) {
      var ts = parseISO(e.date);
      if (ts !== null && ts >= today) {
        out.push({ ts: ts, temple: e.temple || "", time: e.time || "", note: e.note || "", cancelled: false, extra: true });
      }
    });

    (cfg.skip || []).forEach(function (s) {
      var ts = parseISO(s.date);
      if (ts === null) return;
      out.forEach(function (r) {
        if (r.ts === ts && !r.extra && (!s.temple || s.temple === r.temple)) {
          r.cancelled = true;
          r.note = s.reason || "";
        }
      });
    });

    out.sort(function (a, b) { return a.ts - b.ts || a.temple.localeCompare(b.temple); });
    return out;
  }

  // Announcements that have not expired yet.
  function activeAnnouncements(list, today) {
    return (list || []).filter(function (a) {
      if (!a || !a.title) return false;
      if (!a.until) return true;
      var u = parseISO(a.until);
      return u === null ? true : u >= today;
    });
  }

  var api = {
    hawaiiToday: hawaiiToday, parseISO: parseISO, toISO: toISO, nthSunday: nthSunday,
    describeSundays: describeSundays, buildUpcoming: buildUpcoming, activeAnnouncements: activeAnnouncements
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SiteLogic = api;
})(typeof window !== "undefined" ? window : this);

(function (root) {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function renderNotice(cfg) {
    var notice = document.querySelector(".notice");
    if (notice) notice.hidden = !cfg.showConceptNotice;

    var footerNote = document.querySelector("footer p:last-child");
    if (footerNote) footerNote.hidden = !cfg.showConceptNotice;
  }

  function formatDisplayDate(ts) {
    return new Date(ts).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    });
  }

  function renderNextService(cfg) {
    if (!root.SiteLogic || typeof root.SiteLogic.buildUpcoming !== "function") return;

    var today = root.SiteLogic.hawaiiToday();
    var upcoming = root.SiteLogic.buildUpcoming(cfg, today, 6) || [];
    var next = upcoming[0] || null;
    var nextLabel = document.getElementById("nextLabel");
    var nextWhen = document.getElementById("nextWhen");
    var nextWhere = document.getElementById("nextWhere");
    var nextPanel = document.getElementById("next");
    var upcomingBody = document.getElementById("upcomingBody");

    if (nextLabel) nextLabel.textContent = next && next.ts === today ? "Service today" : "Next service";
    if (nextWhen) nextWhen.textContent = next ? formatDisplayDate(next.ts) : "";
    if (nextWhere) nextWhere.textContent = next ? [next.temple, next.time].filter(Boolean).join(", ") : "";
    if (nextPanel) nextPanel.classList.toggle("on", !!next);

    if (upcomingBody) {
      upcomingBody.innerHTML = "";
      (upcoming.slice(0, 6)).forEach(function (item) {
        var tr = document.createElement("tr");
        var serviceText = item.cancelled
          ? ["No service", item.note].filter(Boolean).join(" — ")
          : [item.time, item.note].filter(Boolean).join(" — ");
        var cells = [
          formatDisplayDate(item.ts),
          item.temple,
          serviceText
        ];

        cells.forEach(function (cellText) {
          var td = document.createElement("td");
          td.textContent = cellText;
          tr.appendChild(td);
        });
        upcomingBody.appendChild(tr);
      });
    }

    var upcomingSection = document.getElementById("upcoming");
    if (upcomingSection) upcomingSection.hidden = !upcoming.length;
  }

  function renderAnnouncements(cfg) {
    var section = document.getElementById("announcements");
    var list = document.getElementById("announcementsList");
    if (!section || !list || !root.SiteLogic || typeof root.SiteLogic.activeAnnouncements !== "function") return;

    var announcements = root.SiteLogic.activeAnnouncements(cfg.announcements, root.SiteLogic.hawaiiToday());
    list.replaceChildren();

    announcements.forEach(function (item) {
      var article = document.createElement("article");
      article.className = "announcement";

      var title = document.createElement("h3");
      title.textContent = item.title;
      article.appendChild(title);

      var date = root.SiteLogic.parseISO(item.date);
      if (date !== null) {
        var time = document.createElement("time");
        time.dateTime = root.SiteLogic.toISO(date);
        time.textContent = new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC"
        });
        article.appendChild(time);
      }

      if (item.text) {
        var text = document.createElement("p");
        text.textContent = item.text;
        article.appendChild(text);
      }

      list.appendChild(article);
    });

    section.hidden = announcements.length === 0;
  }

  function renderTempleCards(cfg) {
    var schedule = document.querySelector(".schedule");
    if (!schedule) return;

    var temples = cfg.temples || [];
    schedule.replaceChildren();

    temples.forEach(function (temple) {
      if (!temple || !temple.name) return;

      var card = document.createElement("div");
      card.className = "temple";

      var title = document.createElement("h3");
      title.textContent = temple.name;
      card.appendChild(title);

      var days = document.createElement("p");
      days.className = "days";
      days.textContent = root.SiteLogic && typeof root.SiteLogic.describeSundays === "function"
        ? root.SiteLogic.describeSundays(temple.sundays || [])
        : "";
      card.appendChild(days);

      var time = document.createElement("p");
      time.className = "time";
      time.textContent = temple.time || "";
      card.appendChild(time);

      var place = document.createElement("p");
      place.className = "place";
      place.textContent = [temple.street, temple.city].filter(Boolean).join(", ");
      card.appendChild(place);
      schedule.appendChild(card);
    });
  }

  function renderVisitPlaces(cfg) {
    var places = document.querySelector(".places");
    if (!places) return;

    var temples = cfg.temples || [];
    places.replaceChildren();

    temples.forEach(function (temple) {
      if (!temple || !temple.name) return;

      var placeCard = document.createElement("div");
      placeCard.className = "place-card";

      var title = document.createElement("h3");
      title.textContent = temple.fullName || temple.name;
      placeCard.appendChild(title);

      var address = document.createElement("address");
      [temple.street, temple.city].filter(Boolean).forEach(function (line, index) {
        if (index) address.appendChild(document.createElement("br"));
        address.appendChild(document.createTextNode(line));
      });
      placeCard.appendChild(address);

      var mail = document.createElement("p");
      mail.className = "mail";
      mail.textContent = temple.mailing ? "Mailing address: " + temple.mailing : "";
      placeCard.appendChild(mail);

      var query = temple.mapQuery || [temple.street, temple.city].filter(Boolean).join(" ");
      var mapLink = document.createElement("a");
      mapLink.className = "maplink";
      mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
      mapLink.textContent = "Open " + temple.name + " in Maps";
      placeCard.appendChild(mapLink);
      places.appendChild(placeCard);
    });

    var visitSection = document.getElementById("visit");
    if (visitSection) visitSection.hidden = places.children.length === 0;
  }

  function renderPhotos(cfg) {
    var section = document.getElementById("gallery");
    var gallery = document.getElementById("photoGallery");
    if (!section || !gallery) return;

    gallery.replaceChildren();
    (cfg.photos || []).forEach(function (photo) {
      if (!photo || !photo.file) return;

      var figure = document.createElement("figure");
      figure.className = "gallery-item";

      var image = document.createElement("img");
      image.src = (cfg.photoFolder || "") + photo.file;
      image.alt = photo.caption || "";
      image.loading = "lazy";
      figure.appendChild(image);

      if (photo.caption || photo.date) {
        var caption = document.createElement("figcaption");
        if (photo.caption) caption.appendChild(document.createTextNode(photo.caption));
        var date = root.SiteLogic && typeof root.SiteLogic.parseISO === "function"
          ? root.SiteLogic.parseISO(photo.date)
          : null;
        if (date !== null) {
          if (photo.caption) caption.appendChild(document.createElement("br"));
          var time = document.createElement("time");
          time.dateTime = root.SiteLogic.toISO(date);
          time.textContent = new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC"
          });
          caption.appendChild(time);
        }
        figure.appendChild(caption);
      }

      gallery.appendChild(figure);
    });

    section.hidden = gallery.children.length === 0;
  }

  function renderWordmark(cfg) {
    var wordmark = document.querySelector(".wordmark");
    if (!wordmark) return;

    var titleText = (cfg.temples || []).map(function (t) {
      return t.fullName || t.name;
    }).join(" and ");

    if (titleText) {
      var text = document.createTextNode(titleText);
      wordmark.innerHTML = "";
      wordmark.appendChild(text);
      var small = document.createElement("small");
      small.textContent = "Shin Buddhist temples in North Hawaiʻi";
      wordmark.appendChild(small);
    }
  }

  function renderHero(cfg) {
    var temples = cfg.temples || [];
    var templeNames = temples.filter(function (temple) { return temple && temple.name; }).map(function (temple) {
      return temple.name;
    });
    var title = document.querySelector(".hero h1");
    if (title && templeNames.length) {
      title.textContent = templeNames.join(" and ") + " Hongwanji Missions";
    }

    var lede = document.querySelector(".hero .lede");
    if (lede && templeNames.length) {
      lede.textContent = templeNames.length === 2
        ? "Two Shin Buddhist temples in North Hawaiʻi. If you would like to attend a service, Reverend Daido Baba will be glad to hear from you."
        : templeNames.length + " Shin Buddhist temples in North Hawaiʻi. If you would like to attend a service, Reverend Daido Baba will be glad to hear from you.";
    }

    if (templeNames.length) document.title = templeNames.join(" and ") + " Hongwanji Missions";
  }

  if (typeof document === "undefined") return;

  ready(function () {
    var cfg = root.SITE || {};
    renderNotice(cfg);
    renderAnnouncements(cfg);
    renderTempleCards(cfg);
    renderVisitPlaces(cfg);
    renderPhotos(cfg);
    renderNextService(cfg);
    renderHero(cfg);
    renderWordmark(cfg);
  });
})(typeof window !== "undefined" ? window : this);
