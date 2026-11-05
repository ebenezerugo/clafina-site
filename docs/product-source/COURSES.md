# Courses (the courses pack)

Training for staff and courses for customers (boards `erp4f-course-builder`, `erp4f-course-progress`;
RECOMMENDATIONS-F §9; package `design-handoff/feature-inventory/courses.md`). Built 25 October 2026 on
`feature/industry-packs-rest-api-2`.

## The pack

`courses`, version 1, kind `school` (also `training_centre`). Features `courses.courses`, `courses.enrolments`,
`courses.certificates`. Menu "Courses": Courses, Learners, Certificates, My learning. Three Home cards (declared). The
installer writes nothing.

## Data (schema `courses`, migration `1790650000000`)

| Table | What it holds |
|---|---|
| `courses` | Number `CRS-…`, title, languages, audience (staff, customers, both), the customer price, approval, pass mark, retakes and the gap between them, the certificate and how many months it lasts, when a learner is stuck; draft, published, retired. Versioned; **read model `course`** (with its outline). |
| `modules`, `lessons` | The outline. A lesson is `video`, `reading`, `quiz` or `live`: its Drive file and length, captions, the reading's text, resources, the rule that makes it done (`watch` a share, `open`, `pass`), a quiz's pass mark, draw and whether it is the final one. |
| `questions` | A quiz's bank: single, multiple or true or false, choices, the answer, points. |
| `enrolments` | A learner: staff (from HR, with their sign-in) or a customer; invited, waiting for approval, waiting for payment, enrolled, completed, withdrawn; lessons done, progress, last lesson and visit, best and last score, the invoice, the certificate. Versioned; **read model `course-enrolment`**. |
| `lesson_progress` | Per learner and lesson: the stretches watched as the server accepted them, opened, done. |
| `quiz_attempts` | Each attempt: its number, the questions drawn, the answers, the score, passed. |
| `certificates` | Number `CERT-…` (its own series), the learner, the course, the score, given and running out, the verification code, revoked with the reason and the one that replaces it, the HR compliance record. |

## Rules (`logic/course.logic.ts`)

- **Watching** is reported by the player as stretches (`from`, `to` seconds). The server joins them and takes only as
  much new time as has passed since the last report at one and a half speed plus five seconds; a report claiming more is
  cut back (`clipped: true`). A video is done when the stretches cover `watchPercent` of its length (the lesson's
  `durationSeconds`, not the player's).
- A reading or a live lesson is done when opened; a quiz when passed.
- **Quizzes**: an attempt draws `drawCount` questions from the bank (all when empty), seeded by the attempt so a reload
  re-reads the same draw; answers are never sent; a question is right only with exactly its answers. Pass at the
  lesson's mark, else the course's. Tries are `1 + retakes`, `retakeGapHours` apart; passed is final.
- **Finishing**: every active lesson done → completed; the certificate is given (when the course gives one) with the
  final quiz's best passing score; a member of staff's is added to their HR record (compliance, kind training, the
  certificate number as reference, its expiry).
- **Publishing** needs a lesson and every lesson ready: a video with its file and length (and captions when
  `captionsRequired`), a reading with text or a file, a quiz with enough questions. Staff invited to a draft course are
  enrolled when it is published.
- **Customers** join a published course for customers; a priced place is invoiced (`PackInvoicer`, the service item of
  the settings); with `holdUntilPaid` they wait (`pending_payment`) until `confirm-payment`. Staff are never invoiced.
- **Where people stop**: the lesson with the biggest fall from the one before, in a sentence, with a hint from the
  lesson's own facts (a short reading with no picture, a long video, a quiz).
- **A learner's state** (finished, not started, on track, stuck after `stuckAfterDays`, retake after a failed quiz, or
  their status) is worked out per page for today.

## Settings (`DocumentType.COURSE`; certificates `COURSE_CERTIFICATE` are held to them)

`captionsRequired` (false), `defaultPassMark` (70), `defaultRetakes` (3), `defaultRetakeGapHours` (24),
`defaultCertificateExpiryMonths` (24), `stuckAfterDays` (7), `holdUntilPaid` (false), `postInvoices` (submit),
`dueInDays` (0), `serviceItemId` (required to enrol a paying customer).

## API (`/api/v1/courses`)

| Route | Permission |
|---|---|
| `GET /` (keyset, read store) · `GET :id` (read store, with readiness) · `GET :id/drop-off` | `courses.courses.read` |
| `POST /` · `PATCH :id` · `POST :id/publish` · `…/retire` · `POST :id/modules` · `PATCH modules/:moduleId` · `POST :id/lessons` · `PATCH lessons/:lessonId` · `GET/POST lessons/:lessonId/questions` · `PATCH questions/:questionId` | `courses.courses.manage` |
| `GET :id/learners` (keyset, read store; `state`, `learnerKind`, tabs by state) · `GET :id/learner-tallies` · `GET enrolments/:id` (read store) | `courses.enrolments.read` |
| `POST enrolments` · `POST enrolments/:id/approve` · `…/confirm-payment` · `…/withdraw` | `courses.enrolments.manage` |
| `POST :id/enrol-me` · `GET me/learning` · `GET me/learning/:enrolmentId` (the player) · `GET enrolments/:id/progress` · `PUT lessons/:lessonId/progress` · `POST lessons/:lessonId/attempts` · `POST attempts/:attemptId/submit` | `courses.learn` (the learner themselves, or one who manages learners) |
| `GET :id/certificates` · `GET certificates/:id` · `GET certificates/verify/:code` | `courses.certificates.read` |
| `POST certificates/:id/revoke` (`reissue`) | `courses.certificates.manage` |

**The player's read** (`GET me/learning/:enrolmentId`, 25 October): `GET :id` is the builder's (`courses.courses.read`),
so a learner holding only `courses.learn` was refused in the player. The player reads the course through the
enrolment instead: the learner's own (or anyone's, for those who manage learners), never a draft course. It answers
`{ enrolment, course, progress, quizzes }` — `course` is the read model's document (outline `modules[].lessons[]`,
`lessons`, `minutes`; read organisation-wide by the enrolment's course, since a learner may hold no read at its place),
`progress` the per-lesson rows, and `quizzes[]` one per quiz lesson: `lessonId`, `passMark`, `questionsDrawn`,
`attemptsAllowed`, `attemptsMade`, `attemptsLeft`, `bestScore`, `lastScore`, `passed`, `openAttemptId`, `canStart`,
`reason`, `nextAt`. No question and no answer is ever in it: an attempt draws its questions (`POST lessons/:lessonId/attempts`).

Seed `1790650000101`. Events `Course`, `CourseEnrolment`, `CourseCertificate` (created, updated), topic
`commerce.courses.v1`. Read models `course` and `course-enrolment` (location-scoped, keyset indexes in the migration).

## Tests

Unit (run): `logic/course.logic.spec.ts` (watching bounded by time, done rules, scoring, the draw, retakes, states,
drop-off, readiness, expiry), `use-cases/list-learners.use-case.spec.ts` (the read store), `use-cases/get-my-course.use-case.spec.ts` (the player's read), `courses-permissions.spec.ts`,
`course.settings.spec.ts`. Written, not run: `test/courses.e2e-spec.ts`, the tenancy-sweep fixtures and the read-store
leg.

## Not yet

The certificate as a designed document (the document designs) and a public verification page (the shop or a portal),
captions as a separate upload flow (they are Drive files named on the lesson), telling staff in their Inbox on publish
(their enrolment's event carries it; a notification subject is the notification lane's), sending reminders, cohorts and
scheduled classes (the booking engine), Meet for live lessons, selling on the shop (the store-front lane enrols through
`POST enrolments`).

## History

- 25 October 2026: built.
- 25 October 2026: the player's read, `GET me/learning/:enrolmentId` (a learner with only `courses.learn`).
