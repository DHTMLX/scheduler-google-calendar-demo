import { Router, Request, Response, NextFunction } from "express";
import { calendar_v3 } from "googleapis";
import * as googleService from "../services/googleService.ts";
import { toDhxEvent, toGoogleEventPayload } from "../mappers/eventMapper.ts";
import type { AuthenticatedRequest } from "../types/auth.types.ts";
import { DhxEvent } from "../types/types.ts";

const router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const authedReq = req as AuthenticatedRequest;
  try {
    // get all calendars
    const calendars = (await googleService.listCalendars(authedReq.user.tokens)) as calendar_v3.Schema$CalendarListEntry[];

    const mappedCals = calendars
      .filter((calendar) => Boolean(calendar.id))
      .map((calendar) => ({
        id: calendar.id as string,
        key: calendar.id as string,
        label: calendar.summary ?? "",
        backgroundColor: calendar.backgroundColor ?? undefined,
      }));

    const fromQuery = typeof req.query.from === "string" ? req.query.from : undefined;
    const toQuery = typeof req.query.to === "string" ? req.query.to : undefined;

    const minDate = fromQuery ? new Date(fromQuery).toISOString() : new Date().toISOString();
    const maxDate = toQuery ? new Date(toQuery).toISOString() : undefined;

    // get events from all calendars
    const googleEvents = await Promise.all(
      mappedCals.map(async (calendar) => {
        const params: calendar_v3.Params$Resource$Events$List = {
          calendarId: calendar.id,
          timeMin: minDate,
        };
        if (maxDate) {
          params.timeMax = maxDate;
        }
        const calendarEventsResponse = await googleService.listEvents(authedReq.user.tokens, params);
        return (calendarEventsResponse as Array<Record<string, unknown>>).map((event) => toDhxEvent(event as calendar_v3.Schema$Event, calendar));
      })
    );

    res.json({
      success: true,
      data: googleEvents.flat(),
      collections: { calendars: mappedCals },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const authedReq = req as AuthenticatedRequest;
  const calendarId = (req.body as DhxEvent)?.calendarId as string | undefined;

  try {
    const gEvent = await googleService.createEvent(authedReq.user.tokens, calendarId, toGoogleEventPayload(req.body));
    res.status(201).json({
      action: "inserted",
      tid: gEvent.id,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`POST /events - ${String(error)}`);
    next(error);
  }
});

router.put("/:eventId", async (req: Request, res: Response, next: NextFunction) => {
  const authedReq = req as AuthenticatedRequest;
  const calendarId = (req.body as DhxEvent)?.calendarId as string | undefined;

  try {
    const gEvent = await googleService.updateEvent(
      authedReq.user.tokens,
      calendarId,
      req.params.eventId as string,
      toGoogleEventPayload(req.body)
    );
    res.json({ action: "updated", tid: gEvent.id });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`PUT /events/${req.params.eventId} - ${error}`);
    next(error);
  }
});

router.delete("/:eventId", async (req: Request, res: Response, next: NextFunction) => {
  const authedReq = req as AuthenticatedRequest;
  const calendarId = (req.body as DhxEvent)?.calendarId as string | undefined;

  // 1) When the main recurring event is deleted, Scheduler then deletes all exceptions.
  // 2) If this is an exception of a recurring event, there is nothing to delete on Google side.
  // Google Calendar removes occurrences when deleting the main recurring event.
  const dhxId = req.body?.id as string | undefined;
  if (typeof dhxId === "string" && dhxId.indexOf("_") > -1) {
    res.json({ action: "deleted" });
    return;
  }

  try {
    await googleService.deleteEvent(authedReq.user.tokens, calendarId, req.params.eventId as string);
    res.json({ action: "deleted" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`DELETE /events/${req.params.eventId} - ${String(error)}`);
    next(error);
  }
});

export default router;
