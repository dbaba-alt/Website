/*
  ============================================================
  EDIT THIS FILE to update the website. You never need to touch
  index.html or site.js for everyday changes.

  How to edit on GitHub: open this file in your repo, click the
  pencil icon, change the text, then click "Commit changes".
  The live site updates in 1 to 2 minutes.

  Keep the punctuation exactly as shown: quotes " ", commas
  between items, and { } around each item.

  WHAT YOU CAN DO HERE
  1. Change a temple's address, time, or which Sundays it meets.
  2. Cancel one service (holiday) or add a special service.
  3. Post an announcement.
  4. Add photos to the Temple activities gallery.
  ============================================================
*/

window.SITE = {

  // Set to false to remove the "concept redesign" banner and footer line.
  showConceptNotice: true

  /* ----------------------------------------------------------
     1. TEMPLES AND REGULAR SCHEDULE
     "sundays" lists which Sundays of the month, e.g. [2, 4] means
     the 2nd and 4th Sunday. The website works out the real dates
     by itself, so they always stay current.
     ---------------------------------------------------------- */
  temples: [
    {
      name: "Kamuela",
      fullName: "Kamuela Hongwanji Mission",
      sundays: [2, 4],
      time: "9:00 to 10:00 AM",
      street: "65-1110 Mamalahoa Hwy.",
      city: "Kamuela, HI 96743",
      mailing: "PO Box 367",
      mapQuery: "65-1110 Mamalahoa Hwy Kamuela HI 96743"
    },
    {
      name: "Kohala",
      fullName: "Kohala Hongwanji Mission",
      sundays: [3],
      time: "10:00 to 11:00 AM",
      street: "53-4300 Akoni Pule Hwy.",
      city: "Kapaʻau, HI 96755",
      mailing: "PO Box 26",
      mapQuery: "53-4300 Akoni Pule Hwy Kapaau HI 96755"
    }
  ],

  /* ----------------------------------------------------------
     2a. CANCELLED SERVICES (holidays, minister away, etc.)
     The date still shows in the list, marked "No service".
     Leave "temple" out to cancel for both temples.
     Example (remove the // at the start of each line to use it):

       { date: "2026-12-27", temple: "Kamuela", reason: "Holiday weekend" },
     ---------------------------------------------------------- */
  skip: [
  ],

  /* ----------------------------------------------------------
     2b. EXTRA / SPECIAL SERVICES
     Date format is year-month-day. Example:

       { date: "2026-12-06", temple: "Kamuela", time: "10:00 AM", note: "Bodhi Day service" },
     ---------------------------------------------------------- */
  extra: [
  ],

  /* ----------------------------------------------------------
     3. ANNOUNCEMENTS
     Newest first. "until" is optional: the announcement
     disappears by itself after that date. Example:

       {
         title: "Year-end cleaning day",
         date: "2026-11-11",
         until: "2026-12-20",
         text: "Everyone is welcome to help clean the temple after service."
       },
     ---------------------------------------------------------- */
  announcements: [
  ],

  /* ----------------------------------------------------------
     4. TEMPLE ACTIVITY PHOTOS
     Step 1: upload the picture into the "images" folder in your
             repo (small files are best, under 1 MB).
     Step 2: add one block below. "file" must match the file name
             exactly, including capital letters.
     Newest first. "date" is optional. Example:

       { file: "bazaar-2026.jpg", caption: "Fall bazaar volunteers", date: "2026-10-18" },
     ---------------------------------------------------------- */
  photoFolder: "images/",
  photos: [
  ]
};
