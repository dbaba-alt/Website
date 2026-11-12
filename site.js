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
