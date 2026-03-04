# DHTMLX Scheduler with Google Calendar

This demo showcases a fullstack application that integrates **DHTMLX Scheduler** with **Google Calendar** using OAuth 2.0 authentication. Users can authenticate with Google, sync their calendars and events bidirectionally, and manage events with full CRUD operations including recurring events.

## Features

-  Google OAuth 2.0 authentication
-  Bidirectional sync with Google Calendar
-  Full CRUD operations (Create, Read, Update, Delete)
-  Recurring events support with RRULE
-  Responsive Scheduler UI
-  Automatic timezone handling

## Prerequisites

-  Node.js 18+ 
-  Google Account
-  [Google Cloud Console](https://console.cloud.google.com/) access
-  Enabled Calendar API in Google Cloud Console
-  Created Auth2 Credentials and downloaded JSON file. 
-  Added Test users (without it, you can’t get the access to the Google Calendar)
-  To get access to the data the following scopes are needed:
  * auth/calendar
  * auth/calendar.calendarlist
  * auth/calendar.events

The publishing status needs to be set to **Testing** for now, since the **Production** status requires the app to be verified by Google. When you use "Testing" status, you need to explicitly add gmail accounts that will give authorization

## How to run

In order to run it you need to generate credentials in [Google Cloud Console](https://console.cloud.google.com/), copy and paste **Client ID** and **Client Secret** into `.env` file, and run the app using following commands, you can check how the credentials should look like in a `.env.example` file

- npm install
- npm run start

The app runs at `http://localhost:3000`

The app expects google auth redirect to `http://localhost:3000/auth/google/callback`

All backend code is located in `server` directory and frontend in `client` directory

## License

Source code in this repo is released under the **MIT License**.

**DHTMLX Scheduler** is a commercial library - use under a valid [DHTMLX
license](https://dhtmlx.com/docs/products/licenses.shtml) license or evaluation agreement.


## Useful links

[DHTMLX Scheduler product page](hhttps://dhtmlx.com/docs/products/dhtmlxScheduler/)

[Documentation](https://docs.dhtmlx.com/scheduler/)

[Blog](https://dhtmlx.com/blog/)

[Forum](https://forum.dhtmlx.com/)
