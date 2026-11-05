# Client records (the client records pack)

Clinics, physiotherapists, therapists, vets, opticians, salons that keep formulas (boards `erp4f-cr-*`,
RECOMMENDATIONS-F §6; package `design-handoff/feature-inventory/client-records.md`). Built 25 October 2026 on
`feature/industry-packs-rest-api`, **to the health-data standard from the first commit** (Nigeria Data Protection Act,
GDPR, HIPAA principles): retrofitting confidentiality is not safe (§15.5).

## The standard, and where each part lives

| Rule | How |
|---|---|
| Clinical fields encrypted again in the application, a key per organisation (envelope encryption, key in a KMS) | `RecordCipher` seals every clinical text with AES-256-GCM under the organisation's data key (`org_keys`, stored only wrapped by the key-encryption key of the `RecordKeyVault` port). The additional data binds a value to its organisation, client and field: a ciphertext moved to another row does not open. Values carry their key version (`k1.…`). The default vault derives its key from the application secret under its own label; a cloud KMS plugs into `RECORD_KEY_VAULT` (an account to open: the user's decision). |
| Search never indexes clinical text | The list searches names, numbers and phones only; nothing clinical is indexed or sent to search. |
| Consent is a record | `consents`: purpose, wording version, signed when and by whom (a guardian for a minor), valid to, withdrawn when and why. Wordings are versioned and append-only. A purpose without valid consent blocks what needs it (`CONSENT_REQUIRED`: a photo, an insurer share). |
| Every read of a clinical field writes an access-log row in the same transaction | `RecordAccessService.use` checks the token and writes the row before anything is read or written; the log is append-only (the application role has SELECT and INSERT only), each row kept ten years (`keep_until`). Exports and prints are logged with their reason. |
| Roles | Treating practitioners (the care team) open without a question; other holders of `clients.clinical.open` give a reason; breaking the glass needs a written reason and is announced at once; front desk and managers (`clients.read`, `clients.manage`) see name, phone, bookings and consent state only; no default role but the owner carries clinical access or the access log (asserted by the permission spec). |
| Idle lock | An open record's token locks after `idleLockMinutes`; a locked token answers **423** (never 401, which would sign the person out); opening again writes a new row. |
| A signed note is immutable | A draft changes; a signed note never does; a correction is a new note naming the first. |
| Deleting only by retention or a reviewed request | No delete route exists. A deletion request decided "done", or the retention rule applied by the privacy officer, erases the clinical content (sealed values set to nothing, the person kept as "Erased client" and a number); the log of it stays. |
| A minor carries a guardian | Registering a client under `majorityAge` needs a guardian; their consent must be the guardian's. Retention runs to `retentionChildYearsAfterMajority` after they come of age if later than the adult rule. |
| Data subject requests | Copy, correction, deletion, each with a due day 30 days from receipt; overdue ones are marked. |
| No clinical text in notifications, URLs, logs, errors, events or the Assistant | Events carry ids, states and flags only (`ClientRecord`, `ClientAccessFlag`, `ClientDataRequest`); errors name the rule, never the content; the token travels in a header (`x-record-token`), never in a URL. |
| Break-glass, unusual speed and exports raise an item for the privacy officer | `ClientAccessFlag-created` is announced at once (a live aggregate held to `clients.log.review`); the access log lists flagged rows and their answers. |

## Data (schema `client_records`, migration `1790500000000`)

`org_keys`, `clients` (number CLI-…, `allergies_sealed`), `care_team`, `notes` (`body_sealed`, signed, supersedes),
`measurements` (series key in clear, label and value sealed), `prescriptions` (`body_sealed`), `documents` (Drive file,
`title_sealed`, kind; a photo needs consent), `consent_wordings` (append-only), `consents`, `access_sessions` (the
token's hash only), `access_log` and `access_log_answers` (append-only), `data_requests` (`details_sealed`). Row-level
security with the tenant policy on every table; nothing is ever removed (the grants hold no DELETE).

## Settings (`DocumentType.CLIENT_RECORD`)

`idleLockMinutes` (5), `manyRecordsThreshold` (10 in ten minutes), `searchThreshold` (20), `hoursFrom`/`hoursTo`
(07:00–20:00), `retentionAdultYears` (10), `retentionChildYearsAfterMajority` (7), `majorityAge` (18),
`privacyOfficerUserId` (the owner when not set).

## API (`/api/v1/client-records`)

| Route | Permission |
|---|---|
| `GET clients` (a search is logged; each row carries `treatmentConsent`: `valid`, `expired`, `withdrawn`, `missing` or `outdated`, read in the list's one statement) · `GET clients/:id` · `GET clients/:id/consents` | `clients.read` |
| `POST clients` · `PATCH clients/:id` · `POST/DELETE clients/:id/care-team…` · `POST clients/:id/consents` · `…/withdraw` | `clients.manage` |
| `POST clients/:id/open` · `POST clients/:id/close` · `GET clients/:id/record` | `clients.clinical.open` |
| `PUT …/record/allergies` · `POST …/record/notes` · `PUT …/notes/:noteId` · `…/sign` · `…/corrections` · `…/measurements` · `…/prescriptions` · `…/stop` · `…/documents` | `clients.clinical.write` |
| `POST …/record/export` (print, copy, insurer) | `clients.clinical.export` |
| `GET access-log` · `POST access-log/:id/answer` | `clients.log.review` |
| `GET/PUT consent-settings` | `clients.consent.manage` |
| `GET/POST data-requests` · `POST data-requests/:id/decide` · `GET retention` · `POST retention/apply` | `clients.requests.manage` |

Every `…/record` route needs `x-record-token`. Seed `1790500000101`: owners all; administrators everything but
`clients.clinical.*` and `clients.log.review`; managers read and `clients.manage`; viewers `clients.read`.

## Tests

Unit (run): `logic/client-records.logic.spec.ts` (sealing and tampering, the key wrap, opening decisions, flags, the
lock and banner, consent states, minors, retention, the 30-day clock), `client-records-permissions.spec.ts` (routes,
and no default role but the owner with clinical access), `client-records.settings.spec.ts`. Written, not run:
`test/client-records.e2e-spec.ts` (including that the stored value is sealed and no event carries clinical text) and
tenancy-sweep fixtures for every table.

## Not yet

A cloud KMS vault (needs the organisation's or Commerce's KMS account), key rotation (the format carries the version;
the re-seal job is not written), a notification-centre subject so flags reach the privacy officer's Inbox as well as
the live log, record templates per profession (physio, therapy, vet with pets and owners, eyewear prescriptions, hair
colour formulas), the client's own consent page, insurer claims and referrals, appointment booking from the record
(the booking engine's own screens book clients today).

## History

- 25 October 2026: built.
