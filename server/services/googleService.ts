import { google, calendar_v3 } from "googleapis";
import type { GoogleOAuthTokens } from "../types/auth.types.ts";
import config from "../config/index.ts";

const calendarClient = google.calendar("v3");

function oauthClient(tokens: GoogleOAuthTokens) {
  const client = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  return client;
}

/* ------ CRUD helpers ------- */

export async function listCalendars(tokens: GoogleOAuthTokens): Promise<calendar_v3.Schema$CalendarListEntry[]> {
  const { data } = await calendarClient.calendarList.list({ auth: oauthClient(tokens) });
  return data.items ?? [];
}

export async function listEvents(
  tokens: GoogleOAuthTokens,
  opts: calendar_v3.Params$Resource$Events$List
): Promise<calendar_v3.Schema$Event[]> {
  const { data } = await calendarClient.events.list({
    auth: oauthClient(tokens),
    ...opts,
  });
  return data.items ?? [];
}

export async function createEvent(
  tokens: GoogleOAuthTokens,
  calendarId: string | undefined,
  gEvent: calendar_v3.Schema$Event
): Promise<calendar_v3.Schema$Event> {
  const { data } = await calendarClient.events.insert({
    auth: oauthClient(tokens),
    calendarId: calendarId || "primary",
    requestBody: gEvent,
    conferenceDataVersion: 1,
  });
  return data;
}

export async function updateEvent(
  tokens: GoogleOAuthTokens,
  calendarId: string | undefined,
  eventId: string,
  gPatch: calendar_v3.Schema$Event
): Promise<calendar_v3.Schema$Event> {
  const { data } = await calendarClient.events.patch({
    auth: oauthClient(tokens),
    calendarId: calendarId || "primary",
    eventId,
    requestBody: gPatch,
  });
  return data;
}

export async function deleteEvent(
  tokens: GoogleOAuthTokens,
  calendarId: string | undefined,
  eventId: string
): Promise<void> {
  await calendarClient.events.delete({
    auth: oauthClient(tokens),
    calendarId: calendarId || "primary",
    eventId,
  });
}
