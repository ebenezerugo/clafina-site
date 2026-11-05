# Capture: Scans and Voice for Data Entry

*Live document: https://claude.ai/artifact/5pq5GoDNym6ugZHNj23CDD (this file is its copy as of 12 October 2026). Kept as Draft 1 for reference; it is carried forward and superseded by the Commerce AI product document (`Commerce-AI-Product-Document.md`), which folds in the answers to its questions.*

11 October 2026 · Eben

Any document in Commerce can be started from a scanned page, a phone photo, a PDF or a voice note: the app reads it, fills the form, and a person checks it before it is saved. Draft 1 for review; open questions are at the end.

## 1. Why

Most documents still arrive on paper or by word of mouth: handwritten delivery notes, stamped supplier invoices, receipt books, waybills, a sales rep phoning in an order, a store keeper reading out a stock count. Each is typed in again by hand, late, with mistakes.

Commerce already reads pasted text with AI (asset documents, Phase 10). This enhancement makes the app read **scans, photos and PDFs** and **listen to voice notes**, and offers that on **every form**, so capturing a document is upload or speak, then check.

## 2. Goals and non-goals

Goals:

1. Any document type can be started from a scan, photo, PDF, email attachment, recorded or uploaded voice note, or live dictation.
2. Printed text, handwriting, tables of line items, stamps and signatures are read; voice is understood in Nigerian English and the languages the organisation chooses.
3. What was read is matched to the organisation's own records: customers, suppliers, products, units, taxes, locations, staff.
4. **A person always checks before anything is saved.** Capture fills a draft through the same rules, validation and approvals as typing; it never posts.
5. The original file or recording stays attached to the document, for audit.
6. The organisation chooses its providers, its budget and how long originals are kept.

Not in this document: fully automatic posting without review; reading documents in the background without someone asking (except the Capture inbox, which only prepares drafts); and free-form chat that operates the app (that is the later AI operator).

## 3. How capture works

Whatever comes in passes the same six steps, and the person's review is the one that can never be skipped.

*(Diagram in the live document: capture flow — six steps, one review.)*

Fixes made at review are remembered per supplier or customer, so matching improves with each document from them.

## 4. What can be captured, and where

Every form gets two buttons, **Fill from a document** and **Dictate**, and there is one inbox for everything that arrives on its own.

| Source | How it comes in |
| --- | --- |
| Scan or photo | Camera on phone or web, or an uploaded JPEG/PNG/HEIC/TIFF; several pages at once |
| PDF | Uploaded, or attached to a Drive file; scanned and digital PDFs alike |
| Email attachment | Forwarded to the organisation's capture address (e.g. capture+eben@…) |
| Voice note | Recorded in the app, or an uploaded audio file (WhatsApp voice notes, m4a, mp3, ogg, wav) |
| Live dictation | Speaking into a form; fields fill as you talk |
| A batch | A stack of scanned pages split into separate documents |

**Where it appears:**

- On every create form, and on a form's line-items table ("add lines from a document").
- In a **Capture inbox**: uploads and forwarded emails are classified ("this looks like a supplier invoice from Golden Foods") and prepared as drafts waiting for someone to check.
- In the phone app, for receipts, delivery notes and counts on the move.

**First targets**, by how often they are keyed by hand:

| Priority | Documents |
| --- | --- |
| 1 | Supplier invoices (bills), expense receipts, goods receipts and delivery notes, purchase orders received from customers |
| 2 | Sales orders and quotations (dictated by reps), stock counts, stock transfers, payment receipts and bank tellers |
| 3 | Customer and supplier onboarding (CAC certificates, TIN letters, IDs, bank letters), staff records, contracts, asset invoices |
| 4 | Everything else: each document type registers what it needs, and capture works on it |

## 5. Reading scans and photos

The app turns pixels into text with the layout kept, so tables stay tables.

- **Clean-up first**: straighten, crop, de-skew, fix contrast and rotation; split a batch into documents; warn on a blurred, dark or partial page before reading it.
- **Printed and handwritten text**, including carbon copies and receipt-book handwriting.
- **Tables of line items**: each row a line with its description, quantity, unit, price and total, even across pages.
- **Stamps and signatures** are detected and noted ("received" stamp, signature present), not read as text.
- **Local formats**: NGN amounts (₦, N, commas), dates written day first, TIN, RC numbers, Nigerian phone numbers, bank account numbers.
- **Checks**: line totals against quantity × price, the total against the lines, VAT against the rate; a mismatch is shown, not silently fixed.
- Malware scanning, as for every Drive upload.

## 6. Voice notes and dictation

A voice note becomes a transcript, and the transcript fills the form. For example: "Sales order for Shoprite Lekki, fifty cartons of Peak milk at twelve thousand five hundred each, deliver Friday" becomes a draft sales order with the customer, the product, 50 cartons, ₦12,500 and Friday's date.

- **Languages**: Nigerian English first; Pidgin, Yoruba, Igbo and Hausa as the organisation turns them on (subject to the provider; see open questions).
- **Recorded or uploaded**: in the app (web and phone), or a file such as a forwarded WhatsApp voice note.
- **Dictation into a form** fills fields as you speak and lets you correct by voice ("make that sixty").
- **Several documents in one note** ("three orders from today's round") are split into separate drafts.
- **Numbers and units spoken aloud** ("five dozen", "half a bag") are resolved to the product's units of measure.
- The recording and its transcript stay attached to the document.

## 7. Understanding and matching

The text is turned into the target document's own fields, each with a confidence and the place it came from, then matched to the organisation's records.

- **One schema per document type**: each type registers its fields and line shape once (the same definition its form and API use), so capture covers a new type without new reading code.
- **Classification**: an inbox item is identified as a type (invoice, receipt, delivery note, purchase order, certificate, ID, bank teller, count sheet) with a confidence.
- **Matching**: names, TINs, phone numbers and account numbers to customers and suppliers; descriptions, SKUs and barcodes to products (supplier item codes from Phase 12 first); units to units of measure; tax rates to tax codes; locations and staff by name.
- **Unknowns are proposed, never invented**: an unmatched supplier or product is offered as a new record to create, or left for the person to pick.
- **Learning from corrections**: when someone fixes a field, the app remembers it for that counterparty ("Golden Foods writes 'Peak 400g tin' for PEAK-MLK-400"), so the next document from them needs fewer fixes.

## 8. Review and creation

Capture ends in the ordinary form, filled, beside the original; nothing is saved until a person confirms.

- **Side by side**: the page or transcript on one side, the form on the other; selecting a field highlights where it was read.
- **Low-confidence fields are flagged** for a look; required fields left empty block saving, as when typing.
- **Same rules as typing**: the document's settings, validation, credit and pricing rules, numbering and approvals all apply. A captured document is a draft until its normal next step.
- **The original is kept** on the document as a Drive reference (scan, PDF or recording, plus the transcript), so anyone checking later sees what it was made from.
- **Audit**: who captured it, from what, what the app read, and what the person changed.

## 9. Providers, cost and privacy

The organisation chooses each provider in Integrations, as with every other service, and a built-in option runs without sending anything outside.

| Step | Built-in (on our servers) | Provider options |
| --- | --- | --- |
| Reading scans (OCR) | Open-source OCR with layout | AWS Textract, Google Document AI, Azure Document Intelligence |
| Voice to text | Open-source speech recognition (Whisper class) | AWS Transcribe, Google Speech-to-Text, Azure Speech, OpenAI |
| Understanding | — | The organisation's AI provider slot (already built; Claude or others) |

- **Budget**: a monthly limit per organisation (the AI slot's token budget, extended to pages and minutes), with a warning near the limit and a clear message when it is reached.
- **Retention**: originals kept as long as the document (default) or for a set period, as the organisation chooses; transcripts kept with the document.
- **Consent**: recording someone else (a customer on a call) needs their agreement; the app reminds the person recording.
- **Personal data**: IDs and bank letters are marked sensitive; their images are visible only to those who may see the record.
- **No training on customer data**: providers are configured not to keep or learn from what is sent.

## 10. Settings, permissions and reports

- **Settings**: capture on or off per document type; providers; languages; monthly budget; the confidence below which a field is flagged; whether the inbox prepares drafts on arrival or waits; how long originals are kept; the capture email address.
- **Permissions**: `capture.use` (fill a form from a file or voice), `capture.inbox.{view,manage}`, `capture.settings.manage`. Creating the document still needs that document's own permission.
- **Reports**: documents captured by type and source; time from arrival to saved; fields corrected per document (accuracy), by counterparty and provider; pages and minutes used against the budget.

## 11. Phasing

1. **Foundation**: provider slots (OCR, speech), the built-in readers, the capture pipeline, one schema per document type, the review screen, originals kept on the document.
2. **Bills and expenses first**: supplier invoices, expense receipts, delivery notes and goods receipts, with line items and supplier matching.
3. **Voice**: recorded and uploaded voice notes and live dictation, starting with sales orders, quotations and stock counts.
4. **Capture inbox and email**: classification, batches split into documents, drafts waiting for review.
5. **Every form**: the remaining document types, onboarding papers (CAC, TIN, IDs, bank letters), staff records.
6. **Learning and reports**: per-counterparty corrections, accuracy and budget reports.
7. **Phone app**: camera capture and voice on the move, offline queueing.

## 12. Open questions (answered 12 October in the Commerce AI document)

1. **Default providers.** Start with the built-in open-source readers (nothing leaves our servers, lower accuracy on poor handwriting), or a cloud provider by default (higher accuracy, a cost per page or minute)?
2. **Languages.** Which besides Nigerian English are needed first: Pidgin, Yoruba, Igbo, Hausa? Support varies by provider.
3. **WhatsApp.** Should voice notes and photos sent to a business WhatsApp number land in the Capture inbox (needs the WhatsApp Business API as a provider)?
4. **Where to start.** Bills and expense receipts first (as proposed), or sales orders by voice first?
5. **Retention.** Keep originals for as long as the document (proposed), or delete scans and recordings after a set period?
6. **Budget.** A default monthly limit for new organisations, or none until an admin sets one?
