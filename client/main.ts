import "./styles.css";
import momentTz from "moment-timezone";
import { scheduler } from "@dhx/trial-scheduler";
import "@dhx/trial-scheduler/codebase/dhtmlxscheduler.css";
import type { DhxEvent, MappedCalendar, SchedulerDataAction , SchedulerDataProcessorPayload } from "../server/types/types";

window.addEventListener("DOMContentLoaded", async () => {
  scheduler.plugins({
    recurring: true,
  });

  scheduler.config.header = ["day", "week", "month", "date", "prev", "today", "next"];

  scheduler.init("scheduler_here", new Date(), "week");
  scheduler.setLoadMode("week");

  scheduler.createDataProcessor(async (
    entity: "event", 
    action: SchedulerDataAction, 
    data: DhxEvent, 
    id: string | number
  ) => {
    const calendars = scheduler.serverList("calendars") as MappedCalendar[];
    data.calendarId = calendars[0]?.id;
    data.timeZone = momentTz.tz.guess();
    return fetchEvent(action, data, id);
  });

  if (GOOGLE_AUTHORIZED) {
    scheduler.load("/events");
  } else {
    window.alert("You must authorize Google Calendar to use this app.");
  }
});

async function fetchEvent(
  action: SchedulerDataAction,
  data: SchedulerDataProcessorPayload,
  id: string | number
): Promise<unknown> {
  const requestConfigs: Record<SchedulerDataAction, [string, string, SchedulerDataProcessorPayload]> = {
    create: ["POST", "events/", data],
    update: ["PUT", `events/${id}`, data],
    delete: ["DELETE", `events/${id}`, data],
  };

  const [method, url, payload] = requestConfigs[action];

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as unknown;
  return result;
}
