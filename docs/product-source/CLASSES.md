# Classes and check-in (the classes pack)

A week of classes with places and a waiting list, bookings on a plan or a class pack, check-in at the door through the
memberships desk, class packs and teachers' pay, on Bookings and Memberships (boards `erp4f-cls-*`;
RECOMMENDATIONS-F §14; package `design-handoff/feature-inventory/classes.md`). Built 25 October 2026 on
`feature/industry-packs-final-3`.

## The pack

`classes`, version 1 ("Classes and check-in"), no kind of its own (a place keeps its kind; `studio` is offered). Features
`classes.schedule`, `.checkin`, `.packs`, `.pay`. Menu "Classes": Class schedule, Check-in, Class packs, Teachers' pay.
Four Home cards (declared). The installer writes nothing. Members book on their plan when the memberships pack is on at
the place; anyone with a class pack's credits books without it.

## Data (schema `classes`, migration `1790900000000`)

| Table | What it holds |
|---|---|
| `class_types` | What is taught: name, the memberships area its entitlement checks (default `classes`), places, length, room, teacher, a drop-in price, credits a booking takes. |
| `sessions` | A class at a time: room, teacher, places, and the booked, waiting and attended counts (kept from the bookings); scheduled, cancelled, done. A database check keeps booked within the places. Read model `class-session` (with bookings and the waiting list in order). |
| `bookings` | A person's place (a member, or a customer): booked, waiting (in order), offered (until when), offer lapsed, cancelled, late cancelled, attended, no-show; paid with the plan, a credit or as a drop-in (its invoice); when checked in, why turned away. One live place a person a class (a database constraint). |
| `class_packs`, `credits`, `credit_ledger` | Packs (classes, price, days good for); a customer's credits with the invoice; every credit bought, taken, given back or kept (append-only). |
| `teacher_rates` | A teacher's pay a class and an attendee, from a day. |

## Rules (`logic/classes.logic.ts`)

- **Places**: a booking takes a place while there is one (the class row is locked, so two people never take the last);
  else it joins the waiting list at the end. Colours: open, almost full (two places or 15% left), full.
- **Paying**: a member pays with the plan when the memberships entitlement allows the class's area now; otherwise (or a
  customer) the soonest-expiring credits that cover the class (taken at booking); otherwise a drop-in, invoiced, when
  asked for and the class has a price.
- **Cancelling**: free until `cancelFreeHours` before (the credit back); later is a late cancel (the credit kept when
  `lateCancelTakesCredit`). A place freed is offered to the first waiting.
- **Offers**: the first waiting is offered the place for `offerMinutes` by email; a delayed job lets an untaken offer
  lapse and offers the next; staff may offer a place to anyone waiting; taking it pays for it then.
- **Check-in** is the memberships desk's one use case (`CheckInService`, source `class`, the class's area): the
  entitlement is asked, the visit written and counted once; the booking is marked attended once (a second scan is let
  through, not counted). A refusal is kept on the booking with its reason; `override` lets a person in once with a
  reason (the desk's rule). The doors are open from `doorsOpenMinutes` before to `doorsCloseMinutes` after the start. A
  walk-in with a free place is booked at the door. A credit or drop-in place is checked in from the class list.
- **No-shows**: a delayed job at each class's end (moved with the class) marks those booked who never came (the credit
  kept when `noShowTakesCredit`), lapses any open offer, and closes the class.
- **Teachers' pay** a month = classes taught × the rate a class + attendees × the rate an attendee (the rate in force on
  the month's first day).
- **Cancelling a class**: every place cancelled, every credit back, everyone emailed.

## Settings (`DocumentType.CLASS_BOOKING`)

`cancelFreeHours` (2), `lateCancelTakesCredit` (true), `noShowTakesCredit` (true), `offerMinutes` (15),
`doorsOpenMinutes` (30), `doorsCloseMinutes` (10), `bookAheadDays` (14), `packInvoices` (post), `packServiceItemId`.

## API (`/api/v1/classes`)

| Route | Permission |
|---|---|
| `GET schedule?from&to&room&teacher` · `GET types` · `GET sessions` (keyset, read store) · `GET sessions/:id` | `classes.schedule.read` |
| `POST types` · `PATCH types/:id` · `POST sessions` (`repeatWeeks`) · `PATCH sessions/:id` · `POST sessions/:id/cancel` | `classes.schedule.manage` |
| `POST sessions/:id/bookings` · `POST bookings/:id/cancel` · `…/offer` · `…/accept` · `POST sessions/:id/message` | `classes.bookings.manage` |
| `GET sessions/:id/attendance` | `classes.checkin.read` |
| `POST check-ins` | `classes.checkin.manage` |
| `GET packs` · `GET credits?customerId` | `classes.packs.read` |
| `POST packs` · `PATCH packs/:id` | `classes.packs.manage` |
| `POST packs/:id/sell` | `classes.packs.sell` |
| `GET teacher-rates` · `GET teacher-pay?month` | `classes.pay.read` |
| `POST teacher-rates` | `classes.pay.manage` |

Seed `1790900000101`. Events `ClassSession`, `ClassBooking`, `ClassCredit` (created, updated), topic
`commerce.classes.v1`. Read model `class-session` (location-scoped, keyset indexes). Jobs: the `classes` queue's
delayed `offer-lapse` and `session-close` (no schedule, no cross-tenant read). Memberships now exports `CheckInService`
(with `whoIs`) through `memberships/public-api.ts`.

## Tests

Unit (run): `logic/classes.logic.spec.ts`, `classes-permissions.spec.ts`, `classes.settings.spec.ts`. Written, not run:
`test/classes.e2e-spec.ts`, the tenancy-sweep fixtures and the read-store list.

## Not yet

The member's own booking screen and app; offers pushed by WhatsApp or SMS (email now); teacher pay sent to HR payroll as
an input (read here); online classes as Meet rooms made for them (a link is kept); rooms as booking-engine resources (a
name now); class packs in a currency other than the place's; loyalty points for attendance.

## History

- 25 October 2026: built.
