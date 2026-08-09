# Event Flow Dashboard

Project

Build a modern SaaS web application called EventFlow.

EventFlow allows webinar hosts, churches, businesses, coaches, and communities to create registration pages for events and collect attendee information.

The application should be clean, responsive, mobile-first, and built with reusable components using React, TypeScript, Tailwind CSS, Supabase Authentication, PostgreSQL, and Supabase Storage.

Core Features

Authentication

Create:

 Sign Up

 Login

 Forgot Password

 Email Verification

There are two roles:

 Admin

 Host

Host Dashboard

After login, show:

 Total Events

 Total Registrations

 Active Events

Include a prominent Create Event button and a list of the host's events.

Event Creation

Allow hosts to create an event with:

 Event Title

 Description

 Banner Image

 Organizer Name

 Event Category

 Event Type (Online or Physical)

 Event Date

 Event Time

 Time Zone

 Event Visibility (Public, Private, Unlisted)

 Destination after registration:

 WhatsApp

 Telegram

 Zoom

 Google Meet

 Microsoft Teams

 Custom URL

Generate a unique event URL after publishing.

Registration Form

Default fields:

 Full Name

 Email

 Phone Number

Allow hosts to add custom fields:

 Short Text

 Long Text

 Dropdown

 Radio Button

 Checkbox

Each field can be marked Required or Optional.

Public Event Page

Display:

 Banner

 Title

 Description

 Organizer

 Date & Time

 Countdown

 Registration Form

The page must be responsive and SEO-friendly.

Registration Flow

When someone registers:

 Save the registration in Supabase.

 Automatically sync the registration to the host's connected Google Sheet in real time.

 Redirect the attendee to the selected destination (WhatsApp, Telegram, Zoom, Google Meet, Microsoft Teams, or Custom URL).

Do not use CSV export as the primary workflow.

Google Sheets

Allow hosts to connect a Google account.

Hosts can:

 Select an existing spreadsheet

 Or create a new spreadsheet

Automatically create column headers and append every new registration as a new row in real time.

Registrations

Hosts should have a page to view all registrations in a searchable table with:

 Name

 Email

 Phone

 Registration Date

Updates should appear automatically.

Email

Send a confirmation email after successful registration.

Include:

 Event Name

 Date

 Time

 Join Link

Admin

Admin can:

 View Users

 View Events

 View Registrations

 Suspend Users

 Delete Events

Design

Create a modern SaaS interface with:

 Responsive layout

 Light mode (dark mode can come later)

 Rounded corners

 Clean typography

 Consistent spacing

 Fast loading

Architecture

Build the project so future features can be added easily, including:

 Paid events

 Event discovery

 Referral system

 QR codes

 Certificates

 AI tools

 Analytics

 White-label support

Do not build these features yet—only prepare the project structure for future expansion.

First thing to do:
Set up the project, authentication, database schema, and dashboard. (I will write the next command after this)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eventflowreg.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eb84d389-086d-4e0c-8a76-bdebbbd3e735).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
