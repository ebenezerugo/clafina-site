# Trading Network and Organisation Customers

*Live document: https://claude.ai/artifact/H6wM9QG9CGvSDQkFsPExVU (this file is its copy as of 12 October 2026). Roadmap: Phase 15.*

11 October 2026 · Eben

Two businesses on Commerce should trade without re-typing: a purchase order one sends becomes the other's sales order, and so on to payment. Customers become organisations as well as people, because the network needs to know which business it is trading with. **Draft 2, 12 October:** your answers are folded in (section 14), with the party-table choice (4.4), passwordless shared links (10.1) and joining from a link (10.2) added.

## 1. Why

**Customers are people today.** Every sales document names a contact, a person. Companies exist in CRM as accounts, but an account cannot be billed or carry credit terms, a tax number or a statement. Billing "Ada Obi" when the debtor is "Shoprite Nigeria Ltd" puts the debt, the tax number and the statement on the wrong party.

**Both sides already use Commerce, and still re-type everything.** Eben Distribution buys from a supplier that also runs Commerce, and sells to it too. Today each purchase order, invoice and payment is emailed as a PDF and keyed in again on the other side. The supplier portal fixes this for suppliers without Commerce; when both run Commerce, the systems should talk directly.

**The idea: a trading network.** Two organisations connect once, by mutual consent. A document one sends becomes the matching document in the other's books, as a draft its own people take forward. Each side keeps its own numbering, approvals, stock and ledger.

## 2. Goals and non-goals

Goals:

1. A customer is an **individual** or an **organisation** (company, partnership, enterprise, government body, NGO, cooperative), with its legal identity, tax numbers, addresses, credit terms, statement and the people who buy for it.
2. Two organisations on Commerce can **connect**, each consenting, each choosing which of its records stands for the other.
3. One connection carries **both directions**: Eben buys from and sells to the same partner over it.
4. **Documents flow** across a connection and land as drafts the receiver acts on, never as postings nobody saw.
5. Each organisation keeps **full control of its own books**.
6. Partners not on Commerce keep using shared links and email, and can move to the network without losing history.
7. Full scope; every behaviour is a setting the organisation chooses.

Not in this document: a public marketplace of strangers, and real bank money movement (held to the end with every real rail). Peppol and EDI are now in scope (section 13, step 9).

## 3. Words

| Word | Meaning |
| --- | --- |
| Party | Anyone an organisation trades with: customer, supplier or both; an individual or an organisation |
| Organisation customer | A customer that is a legal entity, with people who act for it |
| Buyer contact | A person authorised to order for an organisation customer, within limits |
| Network member | An organisation on Commerce that has turned the network on |
| Connection | A consented, two-sided link between two network members |
| Counterpart record | On each side, the local record standing for the other (a customer, a supplier, or one of each) |
| Envelope | A document sent across a connection, with its kind, content, references and delivery state |
| Mirror | The document an envelope becomes in the receiver's books |
| Item map | Which of my products is which of yours |

## 4. Part A — Organisation customers

A customer has a kind: **individual** or **organisation**. Sales documents bill the party, record the buyer who ordered and ship to a site.

**Each organisation's directory is its own.** A customer or supplier, organisation or individual, is a record in the directory of the organisation that added it, readable only by that organisation, even though every organisation shares one database. Adding a business that also runs Commerce does not link your record to its account: if it changes its own profile tomorrow, your record does not change. Connecting on the network (section 5) only lets documents travel; a partner's new address or bank details arrive, at most, as a change request your people accept or ignore.

### 4.1 What an organisation customer holds

| Area | What it holds |
| --- | --- |
| Identity | Legal and trading name, registration number (RC/BN/IT), type, industry, size, website |
| Tax | TIN, VAT registration, withholding status and exemptions (certificates in Drive) |
| Addresses | Registered, billing, and many delivery sites (branches, warehouses, stores) |
| Terms | Currency, price book, payment terms, credit limit and hold, discount limits, sales rep, location |
| People | Contacts with roles: buyer, approver, accounts payable, receiving, decision maker |
| Buyer limits | Amount per order, sites they may order for, whether orders need the customer's approver |
| Group | A parent organisation for consolidated credit, statements and pricing (Shoprite Holdings → its branches) |

Individual customers stay what contacts are today, and may name an organisation they work for; an employee buying privately is not the employer's debt.

### 4.2 What changes in the application

- **Sales documents** (quotation to credit note) carry the billed party, `orderedBy` (the buyer) and `shipTo` (a site).
- **Credit, balances, ageing and statements** are by party and roll up by group; statements go to the accounts-payable contacts.
- **Buyer limits**: an order over a buyer's limit, or for a site they may not order for, is refused or sent to the customer's approver (a setting).
- **Tax**: invoices print the organisation's legal name, address and TIN/VAT; withholding applies where the party withholds.
- **CRM**: accounts become organisation customers; deals, activities, tickets and appointments attach to the organisation and its people.
- **Duplicates**: unique per registration number and TIN; merging moves people, sites and documents.
- **Loyalty** stays with individuals.

### 4.3 Moving existing data

- Every CRM account becomes an organisation customer; its contacts become its people.
- Posted documents and ledger entries never change. Open documents of a contact who belongs to an account stay as billed by default, or are re-pointed to the organisation (a setting).
- Nothing is deleted.

### 4.4 One party table, or several?

You asked for the pros and cons of a single table.

**One table for every party (customers, suppliers, CRM accounts):**

- *For:* a partner that is both your customer and your supplier is one record, so a network connection maps to one party; identity, tax numbers, addresses, verification documents and KYC/KYB live in one place and are checked once; duplicates are caught across sales and purchasing; statements and netting of what they owe you against what you owe them become simple.
- *Against:* customer-only fields (credit limit, price book, loyalty) and supplier-only fields (lead time, bank accounts, scorecards, compliance) become many empty columns in one wide table; permissions get harder, because a sales rep reading a customer must never see supplier bank details on the same row; and every module built on customers and suppliers today (sales, CRM, Phase 12 suppliers, payables) must be re-pointed at once, the largest and riskiest migration of the three choices.

**Separate tables, as today:**

- *For:* no migration; each module keeps its own shape and permissions.
- *Against:* the same business is two or three unrelated records whose names, tax numbers and addresses drift apart; the network must map one connection to up to three records; mutual statements and netting need joins across modules; verification is done twice.

**Decided (12 October): a party table plus role tables.** A small party record holds only identity: kind, legal and trading names, registration and tax numbers, addresses, verification and its documents. Customer, supplier and CRM-account records keep their own tables for role-specific fields and permissions, and each points to its party. A business that is both a customer and a supplier is one party with two roles. It is added on top of today's tables: the party table is filled from today's records, each existing table gains a party reference, and nothing is deleted or rewritten.

## 5. Part B — Joining and connecting

The network is off until an organisation turns it on, and only verified organisations can be found or connect.

### 5.1 Joining

- **Network profile**: the legal name, registration and tax numbers shown to partners, a logo, a contact address, and the document kinds it sends and accepts (Settings → Network).
- **Verification.** Commerce verifies organisations itself and shows a **Verified** tag; only verified organisations can be found or connect. The documents asked for depend on where the organisation is registered (for example a CAC certificate and TIN in Nigeria; company registration and VAT elsewhere), so each country or province has its own slot of required documents, kept in Drive. How deeply an organisation checks its own partners (KYC for individuals, KYB for businesses, KYS for suppliers) is its own setting, with a provider slot for automated checks.

### 5.2 Connecting

- **Invite** from a supplier or customer record ("Connect on Commerce") by network ID, registration number or a person's email; by a shared link or code; or invite a partner not yet on Commerce to join.
- **Both sides consent.** The receiver sees the verified identity, picks or creates its counterpart record, and accepts (needs `network.connections.manage`) or declines with a reason.
- **Roles**: buyer → seller, seller → buyer, or both on one connection; each role maps to its own counterpart record on each side.
- **Scope per direction**: which document kinds flow; a kind flows only if the sender sends it and the receiver accepts it.
- **Pause or end** at any time from either side; delivered documents stay and history stays readable.
- Counterpart records show a **Connected** badge, the partner's verified profile and the connection's activity.

## 6. Item mapping

Each side keeps its own catalogue; lines are matched by identifier, then remembered.

1. Match by GTIN/barcode, then the seller's SKU stored as the buyer's supplier item code (Phase 12 supplier items), then by hand.
2. The seller may share a price-list version over the connection; the buyer adopts it as supplier items and prices.
3. Lines carry the unit and base quantity; a unit the receiver does not hold is flagged, never guessed.
4. An unmapped line arrives as a description-only line flagged for mapping; mapped once, it is remembered.

## 7. Document flows

Every arrow is an envelope; what it becomes on the other side is a draft that side's own people take forward under its own approvals, numbering and settings.

*(Diagram in the live document: nine exchanges between buyer and seller — purchase order to incoming order, order confirmation, change requests, delivery note to expected receipt, receipt notice, invoice to draft bill, credit note, remittance, statement.)*

The same connection also carries price lists (adopted as supplier prices), quotation requests (a draft quotation for the seller), returns (an expected return) and shared quality documents (into supplier compliance).

- **Nothing posts by itself** unless the organisation says so. Auto-accept rules (an order within credit and fully mapped; a fully matched invoice) are off by default and set up per connection by the organisation.
- **Each side owns its numbers**; every document shows the other side's number too.
- **Changes are requests**: after a mirror exists, a later envelope about it shows as a difference, never an overwrite.
- **Standalone still holds**: either side can create a document by hand and link it to an arrived envelope.

## 8. Status, disputes and messages

Each document shows the partner's progress where the partner chooses to share it, for example: Sent → Delivered → Accepted by Golden Foods (their SO-2026-0412) → Shipped → Received → Invoiced → Paid.

- **A thread per document** across the connection (comments and files), visible to the people on each side who may see that document.
- **Disputes** (price, quantity, quality, invoice) are records with a reason, an owner and an outcome, closing with a credit, an amendment or an explanation.

## 9. Settlement and reconciliation

Each side pays and receives in its own books; the network tells the other side what happened.

- **Remittance**: the buyer's payment arrives at the seller as a remittance naming the invoices paid, and receipt matching proposes the match.
- **Settlement through any provider.** Commerce is fully functional on its own: each side records the payment in its own books however the money moved (bank transfer, card, payment link, cash), and the network carries the remittance. Payment providers fill a slot the organisation chooses. The wallet system is a separate product and builds its own settlement on its own roadmap; Commerce does not wait for it.
- **Mutual statements**: either side asks for the other's statement and reconciles it line by line (in transit, disputed, unmatched).
- **Netting** (later, optional, off by default): where two partners owe each other, a netting proposal settles the difference, approved by both finance teams.

## 10. Portals and the network together

Every outsider works with you at one of three depths, and each can move to the next without losing history.

| Depth | For | What they do |
| --- | --- | --- |
| Shared document links (10.1) | Anyone not on Commerce: a customer, a supplier, an individual | Open the document you sent, as the quotation link does today; view, print or download it; accept, propose changes or reject; record a shipment, attach an invoice, answer a request for quote, upload a certificate |
| Shop account (Online Shop document) | Shoppers and company buyers of your online store | Order, pay, track, return, earn loyalty, raise tickets; company buyers with limits and approvers |
| Trading network | Organisations on Commerce | Documents flow system to system, both directions |

**Why not a separate customer portal.** *For one:* a business customer not on Commerce would have a single place to see everything. *Against:* it would repeat the shop's accounts (orders, documents, returns, tickets, loyalty) and the guest links (accept, pay), so the same screens would be built and maintained twice, and it would compete with the network as the place business customers live. **Decided: no separate customer portal.** Shared links and the shop's company accounts cover it, and a customer that wants more opens its own Commerce organisation (a sole proprietor is enough) and connects over the network. Moving from links to the network keeps the history; links stay readable for past documents.

### 10.1 Suppliers: shared links first, the portal optional

Your point: a supplier already runs its business on its own system, so what it needs from you is the document, not another place to sign in to. Weighed:

**A supplier portal (sign in, see everything):**

- *For:* one place for every open order, request for quote, document request, payment and statement; the supplier keeps its own contacts, addresses and certificates up to date; scorecards and corrective actions can be shared.
- *Against:* suppliers rarely sign in to their customers' portals, because they run their own systems; every customer asking them to sign in somewhere is friction; accounts and sign-ins to manage and protect; the work is typed twice anyway, once in the portal and once in their own system.

**Shared links, as quotations work today:**

- *For:* nothing to join and nothing to learn; the supplier opens the link, downloads or prints it, and carries on in its own system; each link reaches one document only, so a leaked link exposes one document, not an account; the same mechanism serves customers and suppliers.
- *Against:* no single list of what is open; links pile up in e-mail; a forwarded link could be acted on by someone else; changing bank details through a link would invite fraud.

**Decided (12 October): links first, and the portal is a setting each organisation chooses,** because suppliers differ: some want one list of everything, most want the document and nothing more.

- **Every supplier-facing document goes out as a link:** purchase order, request for quote, document request, corrective action, remittance advice and statement. The supplier can view, print or download it, and act on it: accept, propose changes or reject a purchase order with a reason; record a shipment; attach its invoice; answer the request for quote; upload a certificate. What it does arrives as a draft or a message your people take forward, never a posting.
- **Passwordless only.** Opening needs only the link; acting asks for a one-time code sent to the e-mail the link was sent to, so a forwarded link cannot be acted on. The organisation's settings decide link expiry, code lifetime and whether a device is remembered. Password sign-in is removed: people with portal accounts today sign in with a code instead.
- **Bank and tax details never change through an ordinary link.** Staff send a dedicated change-request link, and the change goes through the supplier change control already built (approval, and a call-back check if the setting asks).
- **The supplier portal is the organisation's choice** (a setting, on or off, and per supplier if it wishes): when on, a supplier contact who signs in with a code sees everything shared with them, each item opening the same link view. It reuses what Phase 12 step 9 built.
- **One mechanism for both sides:** the same links serve customers (quotation, proforma, invoice, statement) and suppliers.

### 10.2 From a link to joining Commerce

Every shared link is also how Commerce reaches its next organisation.

- **An invitation on every link page:** "Run your business on Commerce", shown by default; the sending organisation can turn it off in its settings.
- **Joining starts from what the link already knows:** the business name and e-mail come pre-filled, and the sender is set up as its first customer or supplier (in the new organisation's own directory, under its own control).
- **Their correspondence moves into their accounts.** Once the new organisation is set up, it is offered the documents shared with it by links: open ones arrive as drafts in its own books (a purchase order it received becomes a draft sales order; an invoice sent to it becomes a draft bill), and closed ones arrive as read-only history. Its people choose what to take; nothing posts by itself.
- **The connection is proposed, not forced:** after verification, both sides are asked to connect on the network (section 5); once they do, new documents travel as envelopes instead of links, and the old links stay readable.
- **The inviting organisation's records do not change** when the partner joins (section 4): it keeps its own customer or supplier record and simply sees the Connected badge.
- **Growth reporting for the platform:** which organisation's links brought which new organisations, how many links were opened, acted on, and turned into sign-ups.

## 11. Security, privacy and tenancy

Only the document being sent crosses a connection; nothing else of the sender is readable by the receiver.

Each organisation's customers, suppliers and guests are its own (section 4); a connection or a shared link never exposes one organisation's directory to another.

- **Two rows per connection**, one per organisation, each keyed by organisation first. Envelopes go to the sender's outbox and into the receiver's inbox. No query reads two organisations' rows at once, so the design stays shardable and ready for row-level security.
- **Delivery** through the outbox and Kafka: at least once, idempotent per envelope, ordered per document, retried, with a dead-letter list and a delivery log each side sees for its own envelopes.
- **Permissions**: `network.settings.manage`, `network.connections.{view,manage}`, `network.envelopes.{view,send}`, plus each document's own permission (sending a PO needs the PO permission).
- **Audit** of every send, delivery, acceptance, rejection and change on both sides.
- **Personal data** in envelopes is limited to what the document needs (names and work emails).
- A mirror is the receiver's record; ending a connection never removes it.

## 12. Settings, notifications and reports

**Settings** (per organisation, and per connection where useful): network on/off and profile; kinds sent and accepted; auto-accept rules (off by default); statuses shared back; item-mapping order and whether an unmapped line blocks; whether incoming orders need approval; statement sharing; settlement providers; required fields per customer kind; buyer-limit enforcement (refuse, approver, warn); the supplier portal; the join invitation on link pages.

**Notifications**: connection requested, accepted, paused or ended; incoming order; change request; confirmation with changes; delivery expected; receipt notice with differences; invoice arrived; dispute raised or resolved; remittance received; statement difference; delivery failures; a recipient acted on a shared link.

**Reports**: network activity per connection (time to accept, ship, invoice, pay); partner reliability feeding supplier scorecards; organisation customer revenue, margin, ageing and credit use by organisation and group; statement reconciliation status; growth from links.

## 13. Data and phasing

Data outline: customers gain a kind, organisation fields, sites, people with roles, buyer limits and groups, on a shared party record; `network.members`, `network.connections` (two rows each), `network.envelopes` (outbox and inbox per side), `network.item_maps`, `network.threads` and `network.disputes`; an outbox event per envelope kind, each payload carrying `organizationId`.

Order of building:

1. **Party and organisation customers**: the party table and roles (4.4); organisation customers with sites, people, buyer limits and groups; billing a party with orderedBy and shipTo; open documents re-pointed or left as the organisation's setting says; posted documents never rewritten. *(Built 12 October.)*
2. **Shared document links and passwordless sign-in**: every document kind, both directions, sent as a link the way quotations are (view, print, download, accept, propose changes, reject, and the supplier's own acts); a one-time code to act; the supplier portal as an organisation setting, signed in with a code; password sign-in removed. *(Built 12 October.)*
3. **Joining from a link** (10.2): the invitation on link pages, sign-up pre-filled, shared documents offered into the new organisation's books, the connection proposed, growth reporting.
4. **Network foundation**: profile, Commerce verification with the Verified tag and per-country document slots, partner checks (KYC, KYB, KYS) as settings, connections, delivery, item maps.
5. **Order to delivery**: PO to incoming order, confirmations, changes, delivery note to expected receipt, receipt notices; auto-accept per connection.
6. **Invoice to cash**: invoice to draft bill with three-way match, disputes, credits, returns, remittances, mutual statements.
7. **Group companies on the network**: organisations in one group trade over the network, and intercompany (built) takes its matching and eliminations from network documents.
8. **Catalogues, RFQs and shared documents** (into supplier compliance).
9. **Peppol and EDI**: both, as translations of the same envelopes for partners outside Commerce.
10. **Netting and reports.**

## 14. Your answers (12 October)

1. **Party model.** Decided: a small shared identity record, with customer and supplier records keeping their own tables and pointing to it; added on top of today's tables, nothing rewritten (4.4).
2. **History.** A setting: each organisation chooses whether open documents of a contact who belongs to an organisation move to the organisation. Posted documents and ledger entries stay as they are in every case, because rewriting them would change filed accounts and tax returns.
3. **Verification.** Commerce verifies organisations and shows a Verified tag, with document slots by country or province; KYC, KYB and KYS of partners follow each organisation's preference (5.1).
4. **Auto-accept.** Off by default, set up per connection by the organisation (7).
5. **Same group.** The network is the source of truth between organisations, group members included; intercompany builds on it (13, step 7).
6. **Customer portal.** Decided: no separate customer portal (10).
7. **Standards.** Peppol and EDI, both (13, step 9).
8. **Wallet settlement.** Commerce stands fully functional without it; the wallet system builds its own settlement on its own roadmap (9).
9. **Supplier sign-in.** Decided: passwordless only, with documents shared as links the way quotations are (10.1).
10. **Supplier portal.** Decided: a setting each organisation chooses (10.1); links are how Commerce invites the next organisation, and a partner that joins takes its correspondence into its own books (10.2).
