/**
 * Event Configuration System
 *
 * Each event object defines all the details needed for:
 * - Frontend display (title, dates, location)
 * - Constant Contact integration (list ID, tags)
 * - Email content (guest confirmation, internal notification)
 *
 * To add a new event: duplicate an entry below, update the fields,
 * and reference the eventId in the frontend embed.
 */

const events = {
  /* ──────────────────────────────────────────────
     Event 1: APR MV Retirement Classes 2026
     ────────────────────────────────────────────── */
  "apr-mv-retirement-2026": {
    eventId: "apr-mv-retirement-2026",
    eventName: "APR MV RETIREMENT CLASSES 2026 – SATURDAYS",
    eventSubtitle:
      "Learn to navigate retirement with confidence in 2 Saturday mornings at the Mission Viejo Senior Center.",
    presenters: "Nathan Taccini, Victor Quan & Nicole Newman",
    eventDates: [
      {
        label: "Day 1",
        day: "Saturday, April 25, 2026",
        room: "Juniper A&B",
        note: "class 1-3",
      },
      {
        label: "Day 2",
        day: "Saturday, May 2, 2026",
        room: "Juniper A&B",
        note: "class 1-3",
      },
    ],
    time: "8:30am to 1:00pm",
    location: {
      name: "Norman P. Murray Community & Senior Center",
      address: "24932 Veterans Way",
      room: "Juniper A&B",
      city: "Mission Viejo",
      state: "California",
      zip: "92692",
      country: "United States",
    },
    constantContactListId: process.env.CC_LIST_ID_APR_MV || "",
    tags: ["apr-mv-retirement-2026", "retirement-classes"],
    internalRecipients: [
      "macaela@fanwmg.com",
      "info@fanwmg.com",
    ],
    maxAttendees: 5,
  },

  /* ──────────────────────────────────────────────────────────
     Event 2: Sep IVC Retirement Classes 2026 – Wednesdays
     ────────────────────────────────────────────────────────── */
  "sep-ivc-retirement-2026-wed": {
    eventId: "sep-ivc-retirement-2026-wed",
    eventName: "SEP IVC RETIREMENT CLASSES 2026 - WEDNESDAYS",
    eventSubtitle: "Build retirement confidence in 3 Wednesday evenings with expert guidance on planning, taxes, and investing.",
    presenters: "David Reiter, Victor Quan & Nicole Newman",
    eventDates: [
      { label: "Day 1", 
        day: "Wednesday, September 16, 2026", 
        room: "CEC 2",
        note: ""
      },
      { label: "Day 2", 
        day: "Wednesday, September 23, 2026", 
        room: "CEC 2",
        note: ""
      },
      { label: "Day 3", 
        day: "Wednesday, September 30, 2026", 
        room: "CEC 2",
        note: ""
      },
    ],
    time: "6:30pm to 9:15pm",
    location: {
      name: "Irvine Valley College",
      address: "5500 Irvine Center Dr",
      room: "CEC 2",
      city: "Irvine",
      state: "California",
      zip: "92618",
      country: "United States",
    },
    constantContactListId: process.env.CC_LIST_ID_SEP_MV_WED || "",
    tags: ["sep-ivc-retirement-2026-wed", "retirement-classes"],
    internalRecipients: [
      "macaela@fanwmg.com",
      "info@fanwmg.com",
    ],
    maxAttendees: 5,
  },

  /* ──────────────────────────────────────────────────────────
     Event 3: Sep MV Retirement Classes 2026 – Wednesdays
     ────────────────────────────────────────────────────────── */
     "sep-mv-retirement-2026-wed": {
      eventId: "sep-mv-retirement-2026-wed",
      eventName: "SEP MV RETIREMENT CLASSES 2026 - WEDNESDAYS",
      eventSubtitle: "Learn to navigate retirement with confidence in 3 Wednesday evenings at the Mission Viejo Senior Center.",
      presenters: "Tyler Thompkins, Victor Quan & Nicole Newman",
      eventDates: [
        { label: "Day 1",
          day: "Wednesday, September 16, 2026",
          room: "Palo Verde",
          note: ""
        },
        { label: "Day 2",
          day: "Wednesday, September 23, 2026",
          room: "Juniper A&B",
          note: "" 
        },
        { label: "Day 3",
          day: "Wednesday, September 30, 2026",
          room: "Palo Verde",
          note: ""
        },
      ],
      time: "6:30pm to 9:15pm",
      location: {
        name: "Norman P. Murray Community & Senior Center",
        address: "24932 Veterans Way",
        room: "Palo Verde",
        city: "Mission Viejo",
        state: "California",
        zip: "92692",
        country: "United States",
      },
      constantContactListId: process.env.CC_LIST_ID_SEP_MV_WED || "",
      tags: ["sep-mv-retirement-2026-wed", "retirement-classes"],
      internalRecipients: [
        "macaela@fanwmg.com",
        "info@fanwmg.com",
      ],
      maxAttendees: 5,
    },

    /* ──────────────────────────────────────────────────────────
     Event 4: Sep IVC Retirement Classes 2026 – Thursdays
     ────────────────────────────────────────────────────────── */
     "sep-ivc-retirement-2026-thurs": {
      eventId: "sep-ivc-retirement-2026-thurs",
      eventName: "SEP IVC RETIREMENT CLASSES 2026 - THURSDAYS",
      eventSubtitle: "Retire smarter in 3 Thursday evenings—learn strategies to manage money, reduce taxes, and plan your legacy.",
      presenters: "Nathan Taccini, Victor Quan & Nicole Newman",
      eventDates: [
        { label: "Day 1",
          day: "Thursday, September 17, 2026",
          room: "CEC 2",
          note: ""
        },
        { label: "Day 2",
          day: "Thursday, September 24, 2026",
          room: "CEC 2",
          note: "" 
        },
        { label: "Day 3",
          day: "Thursday, October 1, 2026",
          room: "CEC 2",
          note: ""
        },
      ],
      time: "6:30pm to 9:15pm",
      location: {
        name: "Irvine Valley College",
        address: "5500 Irvine Center Dr",
        room: "CEC 2",
        city: "Irvine",
        state: "California",
        zip: "92618",
        country: "United States",
      },
      constantContactListId: process.env.CC_LIST_ID_SEP_IVC_THURS || "",
      tags: ["sep-ivc-retirement-2026-thurs", "retirement-classes"],
      internalRecipients: [
        "macaela@fanwmg.com",
        "info@fanwmg.com",
      ],
      maxAttendees: 5,
    },

    /* ──────────────────────────────────────────────────────────
     Event 5: Sep IVC Retirement Classes 2026 – Saturdays
     ────────────────────────────────────────────────────────── */
     "sep-ivc-retirement-2026-sat": {
      eventId: "sep-ivc-retirement-2026-sat",
      eventName: "SEP IVC RETIREMENT CLASSES 2026 - SATURDAYS",
      eventSubtitle: "Spend two Saturdays learning smart retirement strategies to help you protect, grow, and pass on your wealth.",
      presenters: "Gabby Keefer, Ari Valdez, Victor Quan & Nicole Newman",
      eventDates: [
        { label: "Day 1",
          day: "Saturday, September 19, 2026",
          room: "CEC 2",
          note: ""
        },
        { label: "Day 2",
          day: "Saturday, September 26, 2026",
          room: "CEC 2",
          note: "" 
        },
      ],
      time: "8:30am to 1:00pm",
      location: {
        name: "Irvine Valley College",
        address: "5500 Irvine Center Dr",
        room: "CEC 2",
        city: "Irvine",
        state: "California",
        zip: "92618",
        country: "United States",
      },
      constantContactListId: process.env.CC_LIST_ID_SEP_IVC_SAT || "",
      tags: ["sep-ivc-retirement-2026-sat", "retirement-classes"],
      internalRecipients: [
        "macaela@fanwmg.com",
        "info@fanwmg.com",
      ],
      maxAttendees: 5,
    },

    /* ──────────────────────────────────────────────────────────
     Event 6: Sep MV Retirement Classes 2026 – Saturdays
     ────────────────────────────────────────────────────────── */
     "sep-mv-retirement-2026-sat": {
      eventId: "sep-mv-retirement-2026-sat",
      eventName: "SEP MV RETIREMENT CLASSES 2026 - SATURDAYS",
      eventSubtitle: "Learn to navigate retirement with confidence in 2 Saturday mornings at the Mission Viejo Senior Center.",
      presenters: "Brian Douglass, Nikki Oswalt, Victor Quan & Nicole Newman",
      eventDates: [
        { label: "Day 1",
          day: "Saturday, September 19, 2026",
          room: "Juniper A&B",
          note: "class 1-3"
        },
        { label: "Day 2",
          day: "Saturday, September 26, 2026",
          room: "Juniper A&B",
          note: "class 1-3" 
        },
      ],
      time: "8:30am to 1:00pm",
      location: {
        name: "Norman P. Murray Community & Senior Center",
        address: "24932 Veterans Way",
        room: "Juniper A&B",
        city: "Mission Viejo",
        state: "California",
        zip: "92692",
        country: "United States",
      },
      constantContactListId: process.env.CC_LIST_ID_SEP_MV_SAT || "",
      tags: ["sep-mv-retirement-2026-sat", "retirement-classes"],
      internalRecipients: [
        "macaela@fanwmg.com",
        "info@fanwmg.com",
      ],
      maxAttendees: 5,
    },

    /* ──────────────────────────────────────────────────────────
     Event 7: Sep FAN Retirement Classes 2026 – Thursdays
     ────────────────────────────────────────────────────────── */
     "sep-fan-retirement-2026-thurs": {
      eventId: "sep-fan-retirement-2026-thurs",
      eventName: "SEP FAN RETIREMENT CLASSES 2026 - THURSDAYS",
      eventSubtitle: "Learn to retire confidently with smart, conservative financial strategies in this 3-part evening seminar.",
      presenters: "David Reiter, Victor Quan & Nicole Newman",
      eventDates: [
        { label: "Day 1",
          day: "Thursday, September 24, 2026",
          room: "",
          note: ""
        },
        { label: "Day 2",
          day: "Thursday, October 1, 2026",
          room: "",
          note: "" 
        },
        { label: "Day 3",
          day: "Thursday, October 8, 2026",
          room: "",
          note: ""
        },
      ],
      time: "6:30pm to 9:15pm",
      location: {
        name: "Financial Advisors Network - Training Center",
        address: "1432 Edinger Ave",
        room: "Suite 200",
        city: "Tustin",
        state: "California",
        zip: "92780",
        country: "United States",
      },
      constantContactListId: process.env.CC_LIST_ID_SEP_FAN_THURS || "",
      tags: ["sep-fan-retirement-2026-thurs", "retirement-classes"],
      internalRecipients: [
        "macaela@fanwmg.com",
        "info@fanwmg.com",
      ],
      maxAttendees: 5,
    },

  /* ── Events 3–7: copy the block above and fill in details ── */
};

/**
 * Retrieves an event config by its ID.
 * Throws if the event is not found.
 */
function getEventConfig(eventId) {
  const config = events[eventId];
  if (!config) {
    throw new Error(`Unknown eventId: "${eventId}". Check config/events.js.`);
  }
  return config;
}

module.exports = { events, getEventConfig };
