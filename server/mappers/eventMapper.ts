import moment from "moment-timezone";
import type { DhxEvent, MappedCalendar } from "../types/types.ts";
import type { calendar_v3 } from "googleapis";

/* Convert Google → Scheduler ------------------------------------- */
export function toDhxEvent(gEvent: calendar_v3.Schema$Event, calendar: MappedCalendar): DhxEvent {
  const ev: DhxEvent = {
    id: gEvent.id as string,
    text: gEvent.summary ?? "",
    details: gEvent.description ?? "",
    calendarId: calendar.id,
    calendarLabel: calendar.label,
    timeZone: gEvent.start?.timeZone,
    recurring_event_id: gEvent.recurringEventId,
    status: gEvent.status,
    deleted: gEvent.status === "cancelled",
  };

  // Handle start/end dates
  const start = gEvent.start;
  const end = gEvent.end;

  if (start?.dateTime && end?.dateTime && !gEvent.recurrence?.length) {
    ev.start_date = new Date(start.dateTime);
    ev.end_date = new Date(end.dateTime);
  } else if (start?.date && end?.date && !gEvent.recurrence?.length) {
    // All day event
    ev.start_date = new Date(start.date + "T00:00:00");
    ev.end_date = new Date(end.date + "T00:00:00");
  }

  // Handle recurrence
  if (gEvent.recurrence?.length) {
    ev.rrule = String(gEvent.recurrence[0]).replace("RRULE:", "");

    if (start?.dateTime && end?.dateTime) {
      ev.start_date = new Date(start.dateTime);
      ev.duration = (new Date(end.dateTime).getTime() - ev.start_date.getTime()) / 1000;
    } else if (start?.date && end?.date) {
      // All day event
      ev.start_date = new Date(start.date + "T00:00:00");
      ev.duration = (new Date(end.date).getTime() - ev.start_date.getTime()) / 1000;
    }

    ev.end_date = calculateEndDate(gEvent);
  }

  // exceptions handling
  if (gEvent.originalStartTime?.dateTime) {
    ev.original_start = new Date(gEvent.originalStartTime.dateTime);
  }

  return ev;
}

/* Convert Scheduler → Google ------------------------------------ */
export function toGoogleEventPayload(dhx: DhxEvent): calendar_v3.Schema$Event {
  const tz = dhx.timeZone || "UTC";

  const gEvent: calendar_v3.Schema$Event = {
    summary: dhx.text,
    description: dhx.details ?? "",
  };

  if(dhx.start_date && dhx.end_date){
    const isAllDay =
    dhx.duration === 24 * 60 * 60 ||
    new Date(dhx.end_date).getTime() - new Date(dhx.start_date).getTime() === 24 * 60 * 60 * 1000;

    // Handle recurrence
    if (dhx.rrule && dhx.duration) {
      gEvent.recurrence = ["RRULE:" + dhx.rrule];
      // Set start/end times
      if (isAllDay) {
        gEvent.start = { date: moment(dhx.start_date).format("YYYY-MM-DD") };
        gEvent.end = { date: moment(dhx.start_date).add(1, "day").format("YYYY-MM-DD") };
      } else {
        gEvent.start = {
          dateTime: moment(new Date(dhx.start_date).toISOString()).tz(tz).format("YYYY-MM-DDTHH:mm:ssZZ"),
          timeZone: tz,
        };
        const endDate = new Date(new Date(dhx.start_date).getTime() + dhx.duration * 1000).toISOString();
        gEvent.end = {
          dateTime: moment(endDate).tz(tz).format("YYYY-MM-DDTHH:mm:ssZZ"),
          timeZone: tz,
        };
      }
    } else {
      if (isAllDay) {
        gEvent.start = { date: moment(dhx.start_date).format("YYYY-MM-DD") };
        gEvent.end = { date: moment(dhx.start_date).add(1, "day").format("YYYY-MM-DD") };
      } else {
        gEvent.start = {
          dateTime: moment(new Date(dhx.start_date).toISOString()).tz(tz).format("YYYY-MM-DDTHH:mm:ssZZ"),
          timeZone: tz,
        };
        gEvent.end = {
          dateTime: moment(new Date(dhx.end_date).toISOString()).tz(tz).format("YYYY-MM-DDTHH:mm:ssZZ"),
          timeZone: tz,
        };
      }
    }

    // Handle recurring event instance
    if (dhx.recurring_event_id) {
      gEvent.recurringEventId = dhx.recurring_event_id.toString();
    }
    if(dhx.original_start){
      gEvent.originalStartTime = {
        dateTime: moment(new Date(dhx.original_start).toISOString()).tz(tz).format("YYYY-MM-DDTHH:mm:ssZZ"),
        timeZone: tz,
      };
    }
    if (dhx.deleted) {
      gEvent.status = "cancelled";
    }
  }

  return gEvent;
}

// convert UNTIL=20260129T205959Z -> '2026-01-29T20:59:59Z' if it exists
// if there is no UNTIL -> event repeat infinitely -> return '9999-02-01T00:00:00Z'
function calculateEndDate(gEvent: calendar_v3.Schema$Event): Date {
  const until = String(gEvent.recurrence?.[0] ?? "").match(/RRULE:.*?UNTIL=([^;]+)/)?.[1];

  return until
    ? new Date(
        until.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})T([0-9]{2})([0-9]{2})([0-9]{2})Z$/, "$1-$2-$3T$4:$5:$6Z")
      )
    : new Date(9999, 1, 1);
}
