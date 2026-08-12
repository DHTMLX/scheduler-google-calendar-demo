# DHTMLX Scheduler with Google Calendar Sync (Node.js, OAuth 2.0)
 
A fullstack demo showing **DHTMLX Scheduler** synced two-way with **Google Calendar** through a Node.js/Express backend using **OAuth 2.0**. Covers authentication, calendar loading, full CRUD, and recurring events.
 
**Related guide**: [Two-way sync with Google Calendar (Node.js)](https://docs.dhtmlx.com/scheduler/integrations/google-calendar/google-calendar-sync/)
 
---
 
## What is DHTMLX Scheduler with Google Calendar Demo
 
This repository demonstrates a full-stack integration between **DHTMLX Scheduler** and the **Google Calendar API v3**. Users authenticate with their Google account via **OAuth 2.0** (using Passport's Google strategy), and the app loads their calendars and events directly into Scheduler. Every create, update, and delete performed in Scheduler is forwarded through Scheduler's **DataProcessor** to an Express REST API, which calls the Google Calendar API to keep both sides in sync. A dedicated mapper layer converts between Google's event shape (`start.dateTime`/`start.date`, `recurrence` with `RRULE:` prefixes) and Scheduler's event shape (`start_date`/`end_date`, `rrule`), including handling of all-day events, recurring series, and recurrence exceptions.
 
**Note:** the sync is API-call based (Scheduler → backend → Google Calendar). It does not implement Google → Scheduler push updates via webhooks; changes made directly in Google Calendar appear in Scheduler after a reload.
 
## When to Use
 
Use this demo when you need to:
- Learn the pattern for authenticating users against Google Calendar with OAuth 2.0 and Passport in an Express app
- Implement two-way sync between DHTMLX Scheduler and an external calendar API
- See a working mapper between Google Calendar's event format and Scheduler's event format
- Handle recurring events and recurrence exceptions (`RRULE`, `originalStartTime`) across two different data models
- Get a runnable Node.js + TypeScript reference for a Scheduler `DataProcessor` REST backend

## Demo / Quick Start
 
Prerequisites:
- Node.js 18+
- A Google account with access to [Google Cloud Console](https://console.cloud.google.com/)
- Google Calendar API enabled on your Google Cloud project
- OAuth 2.0 credentials (Client ID and Client Secret) downloaded from Google Cloud Console
- Test users added to the OAuth consent screen (required while the app's publishing status is **Testing**)
- OAuth scope: `https://www.googleapis.com/auth/calendar`
```bash
git clone https://github.com/DHTMLX/scheduler-google-calendar-demo.git
cd scheduler-google-calendar-demo
npm install
npm run start
```
 
Copy `.env.example` to `.env` and fill in your Google **Client ID**, **Client Secret**, and redirect URI before starting the app.
 
Expected result: the app runs at `http://localhost:3000`, and after signing in with Google (redirect URI `http://localhost:3000/auth/google/callback`), Scheduler loads populated with your Google Calendar events.
 
## Architecture
 
- **`server/`** — OAuth 2.0 flow, token handling (kept in session), Google Calendar API v3 calls, and REST endpoints consumed by Scheduler
- **`client/`** — Scheduler initialization/loading and a `DataProcessor` that forwards Scheduler's create/update/delete actions to the server
The REST contract exposed by the server is:
- `GET /events` — loads calendars and events for the authenticated user
- `POST /events` — creates an event
- `PUT /events/:eventId` — updates an event
- `DELETE /events/:eventId` — deletes an event
`GET /events` returns Scheduler-formatted `data` plus a `collections.calendars` list, so multiple Google calendars are available client-side. `[TODO: verify exact folder names against the current repo tree]` — the accompanying integration guide documents this structure in more granular detail (`config/`, `routes/`, `services/`, `mappers/` subfolders under `server/`).
 
## Key Patterns
 
- Storing Google `accessToken`/`refreshToken` on the session user object via Passport's `serializeUser`/`deserializeUser`, rather than a database, to keep the demo simple
- Wrapping Google Calendar API v3 calls (`calendarList.list`, `events.list`, `events.insert`, `events.patch`, `events.delete`) behind a small service layer that builds an authenticated `OAuth2` client per request
- Mapping Google's `start.dateTime`/`start.date` and `recurrence` (`RRULE:` prefixed) fields to Scheduler's `start_date`/`end_date` and `rrule` fields, and back
- Deriving a concrete `end_date` for recurring series by extracting `UNTIL=` from the `RRULE`, or falling back to a far-future date for infinite series
- Forwarding Scheduler's `create`/`update`/`delete` actions to the backend through `scheduler.createDataProcessor()`, attaching the target `calendarId` and the client's timezone to each request

## Code Examples
 
**Google Calendar service layer** (`server/services/googleService.ts`):
 
```ts
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
```
Each request builds a fresh authenticated `OAuth2` client from the session's stored tokens, then calls the corresponding Google Calendar API v3 method.
 
**Mapping a recurring series end date** (`server/mappers/eventMapper.ts`):
 
```ts
// convert UNTIL=20260129T205959Z -> '2026-01-29T20:59:59Z' if it exists
// if there is no UNTIL -> event repeats infinitely -> return '9999-02-01T00:00:00Z'
function calculateEndDate(gEvent: calendar_v3.Schema$Event): Date {
 const until = String(gEvent.recurrence?.[0] ?? "").match(/RRULE:.*?UNTIL=([^;]+)/)?.[1];
 
 return until
   ? new Date(
       until.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})T([0-9]{2})([0-9]{2})([0-9]{2})Z$/, "$1-$2-$3T$4:$5:$6Z")
     )
   : new Date(9999, 1, 1);
}
```
Scheduler expects a concrete `end_date` even for open-ended recurring events, so this helper extracts Google's `UNTIL` value from the `RRULE` string or falls back to a far-future placeholder date.
 
**Forwarding Scheduler CRUD to the backend** (`client/main.ts`):
 
```ts
scheduler.createDataProcessor(async (entity, action, data, id) => {
 const calendars = scheduler.serverList("calendars") as MappedCalendar[];
 
 // Demo simplification: send everything into the first available calendar.
 // In a real app, let users choose a target calendar.
 data.calendarId = calendars[0]?.id;
 
 // Provide client timezone so the server can generate correct dateTime values.
 data.timeZone = momentTz.tz.guess();
 
 return fetchEvent(action, data, id);
});
```
Every Scheduler CRUD action is intercepted here, tagged with a target calendar and the browser's timezone, and sent to the Express API as a `fetch` request.
 
## Features
 
| Feature | Details |
|---|---|
| Google OAuth 2.0 authentication | Passport's Google strategy; tokens stored in the Express session |
| Bidirectional sync | Scheduler ↔ Google Calendar via REST + `DataProcessor` |
| Full CRUD | Create, read, update, delete events from Scheduler |
| Recurring events | `RRULE`-based recurrence, including recurrence exceptions via `originalStartTime` |
| Multi-calendar support | `collections.calendars` exposes all of the user's Google calendars to Scheduler |
| Automatic timezone handling | Client timezone sent with each write; events mapped with `moment-timezone` |
| Responsive Scheduler UI | Standard DHTMLX Scheduler week/day/month views |
 
## Production Notes
 
This is a starting point, not a production-ready app:
- OAuth tokens are stored **in the session**, not in a database — there's no refresh-token rotation, persistence across sessions, or revocation handling
- The Google Cloud OAuth consent screen must stay in **Testing** status (with test users explicitly added) unless you complete Google's app verification for **Production** status
- Sync happens only through API calls triggered by Scheduler actions; there's no webhook-based push sync, so external changes in Google Calendar require a reload
- New events are pushed to the **first available calendar** in the demo; a real app should let users pick a target calendar per event

## Related Resources
 
- [DHTMLX Scheduler product page](https://dhtmlx.com/docs/products/dhtmlxScheduler/)
- [DHTMLX Scheduler documentation](https://docs.dhtmlx.com/scheduler/)
- [Two-way sync with Google Calendar (Node.js) integration guide](https://docs.dhtmlx.com/scheduler/integrations/google-calendar/google-calendar-sync/)
- [Scheduler DataProcessor / server-side integration guide](https://docs.dhtmlx.com/scheduler/guides/server-integration/)
- [Scheduler recurring events guide](https://docs.dhtmlx.com/scheduler/guides/recurring-events/)
- [DHTMLX Blog](https://dhtmlx.com/blog/)
- [DHTMLX Forum](https://forum.dhtmlx.com/)

## License
 
Source code in this repo is released under the **MIT License**.
 
**DHTMLX Scheduler** is a commercial library — use under a valid [DHTMLX license](https://dhtmlx.com/docs/products/licenses.shtml) or evaluation agreement.
 
**Try before you buy**
A free evaluation of DHTMLX Scheduler is available — no credit card required.
[Start your trial →](https://dhtmlx.com/docs/products/dhtmlxScheduler/download.shtml)
