# Online Shop — Product Document

*Live document: https://claude.ai/artifact/Nr5bEiVf5QM3Jw8c6CpAYL (this file is its copy as of 12 October 2026).*

**Status:** Draft 2, 12 October 2026, with your answers folded in (section 13). **Roadmap:** Phase 4.11 (Sales channels: the store front first); steps 1 and 2, the channel and its API, are built.

## 1. Summary

An organisation on Commerce opens an online shop with one button, and can open as many as it needs: one per location, per inventory or per brand (a shoe shop selling only the Shoes inventory, for example). Each shop sells what the ERP says it may sell, at the ERP's prices, from the ERP's stock. Every order, payment, customer, loyalty point and support ticket lands in the ERP as the ordinary record it already understands. **The ERP is the only source of truth:** a shop holds no catalogue, prices, stock, customers or orders of its own, only what the ERP feeds it. The same holds for a sole proprietor and for an organisation with thousands of staff.

## 2. Decisions already made

- **The ERP is the only source of truth,** and governs and controls every shop. There is no standalone shop: one would repeat the ERP's own features.
- **One button sets everything up.** "Create online store" creates the channel's API credentials, the shop's configuration in the store service, a subdomain and the first feed; the Go service talks to the ERP only through those credentials.
- **Many shops per organisation,** each tied to the locations it sells from and the inventory it sells (a dedicated shop for an inventory type such as Shoes), each with its own payment methods, domain and look.
- **The shop is the customer portal.** There is no separate customer portal (the Trading Network decision); company buyers use the shop's company accounts.
- **Shopper accounts belong to one shop.** Each shop has its own domain, so a shopper signs up and signs in per shop. In the ERP, the same person buying from two of the organisation's shops is matched to one customer.
- **Backend:** a Go service from `go-cqrs-boilerplate`. **Front end:** React with Next.js, in the same layered pattern as the ERP's web app. Each in its own repository: `commerce-store-service` and `commerce-storefront`.
- **Orders become sales orders;** payments, customers, loyalty and support tickets all connect to the ERP.
- **Stock comes from inventory types:** each shop sells from the sellable inventory types its settings name (Stock flow, built 12 October), and each line is priced from that inventory's price book.
- **Domains:** a subdomain at once; a domain bought through Commerce (Hostinger domains, resold and set up automatically); or the organisation's own domain or subdomain pointed at the shop; certificates issued automatically.

## 3. Who uses it

- **Shoppers:** individuals, and buyers acting for an organisation (a company account with several people under it), each signed in to one shop.
- **The merchant's team in the ERP:** whoever sets shops up, curates what they sell, sets prices and promotions, fulfils orders, handles returns and answers tickets. Each is a permission. Everything about a shop is managed in the ERP; a shop has no admin of its own.

## 4. Ideas the shop is built from

- **Channel:** a shop is a channel of kind *online store*, with a name the organisation gives it ("Eben Shoes"), its own numbering, prices and settings. An organisation can have any number.
- **Assortment:** what it sells is a rule: every item of an inventory type and category, everything with a tag, or a hand-picked list.
- **Locations:** where it ships from and where shoppers may collect ("ship from Apapa, collect in Ikeja").
- **Availability:** on hand in the shop's sell-from inventory types at its locations, less what is reserved and less safety stock, optionally only a share of it. Two shops and the till can never sell the last unit twice.
- **Price:** the price book of the inventory a line draws from, plus the shop's promotions; tax computed by the ERP's tax rules; shown in the shopper's currency where the shop offers several.
- **Shop account:** belongs to the shop it was made in; in the ERP it is matched to one customer by email or phone across the organisation's shops.

## 5. The shopper's journey

1. **Browse and search:** home page, categories, search with filters (price, brand, attributes), product pages with variants, images from Drive, ratings and reviews, price with tax as the settings show it, and availability (in stock, low, out, or the number, by setting), in the shopper's language and currency where the shop offers several.
2. **Wishlist and alerts:** save items for later; ask to be told when an item is back in stock.
3. **Cart:** survives across devices once signed in; prices and availability re-checked at every step; promotions and coupons applied.
4. **Sign in:** email code, password, phone code, or Google, Apple or Facebook, as the organisation chooses to offer; guest checkout by setting.
5. **Checkout:** delivery address or collection point; delivery fee from the shop's zones and rates or a carrier's quote; the payment methods the shop offers and when payment is taken (at checkout, on delivery, by transfer); order placed with an idempotency key so a double click is one order.
6. **After the order:** confirmation by email, SMS or WhatsApp (the organisation's providers); status as it moves (confirmed, packed, shipped, delivered, collected); invoice and receipt to download.
7. **Account:** orders, addresses, documents, loyalty points and tier, wishlist, returns and support tickets. A company account adds its people, who may order, spending limits, approvals, purchase order numbers and, where the organisation allows, credit terms.
8. **Returns:** asked for from the order, within the shop's return window; becomes a sales return and credit note in the ERP.
9. **Help:** a support ticket from any order or page, answered from the ERP; replies show in the shopper's account.

## 6. Creating and governing a shop

**"Create online store"** on a channel sets up, at once: the channel's API credentials (created and handed to the store service, never shown to anyone); the shop's configuration in the shared store service; a subdomain; the theme and logo from Brand settings; and the first full feed of catalogue, prices and availability, then changes as they happen. One shared, multi-tenant store service serves every shop by its host name, so creating a shop is instant and nearly free; a dedicated container per shop remains an option for a large customer.

**Governed by the ERP:** a shop changes nothing except through the channel API. The ERP can pause, resume, upgrade or retire a shop (never deleting data) and sees its health: sales, traffic, feed lag, failed orders.

**Domains:** a free subdomain at once; a new domain bought through Commerce (Hostinger domains resold, registered and pointed automatically); or the organisation's own domain or subdomain pointed at the shop and verified by DNS. Certificates are issued and renewed automatically.

## 7. The merchant's side in the ERP

A **Channels** screen lists every channel. An online store's page has:

- **Setup:** name, locations, sell-from inventory types, assortment rules, price source and promotions, numbering.
- **Checkout and delivery:** payment methods and when payment is taken; delivery zones and rates, carriers and collection points; minimum order; guest checkout; sign-in methods offered.
- **Look and content:** theme from Brand settings, home page sections, banners, static pages (about, terms, privacy, returns policy), SEO titles and descriptions, all edited here; languages and currencies.
- **Domain:** the subdomain, buying a domain, connecting the organisation's own, certificate status.
- **Company accounts:** buyers, limits, approvals and credit terms, as the organisation sets them.
- **Orders:** shop orders appear in Sales orders tagged with the shop; fulfilment, delivery, invoicing and returns use the ERP's existing documents.
- **Reviews:** moderation of ratings and reviews before they show.
- **Health:** sales, visitors, conversion, abandoned carts, feed lag, failed orders and failed webhooks, with alerts.
- **Controls:** pause, resume, retire; credential rotation; audit trail of every change.

## 8. How the shop and the ERP talk

- **The channel API** (built in step 2): versioned and separate from the admin API, authenticated by the channel's credentials, scoped to that one shop, with its own rate limit. It offers catalogue, prices and availability as a feed (a full load, then changes since a cursor); customer accounts; order intake and order status; returns; and, as the shop is built, payments, loyalty, reviews and support tickets.
- **Events:** the ERP announces changes through its outbox and Kafka (`commerce.channel.v1`), or signed webhooks. The store service never reads the ERP's tables; it keeps a read model of what the feed gives it.
- **Orders:** the shop submits an order once (idempotency key); the ERP reserves stock in the sell-from types at the shop's locations, creates the sales order tagged with the shop, confirms it at once or holds it for review as the settings say, and reports status changes back.
- **Payments:** through the ERP's payment orchestrator, using the methods the shop offers. Real payment rails are held to the end of the programme; until then shops run in test mode. Refunds go back the same way.
- **Customers:** a shop account belongs to its shop; the ERP matches it to one customer across the organisation's shops by email or phone, and records marketing consent.
- **Loyalty:** points earned on paid orders and redeemed at checkout, with tiers, from the ERP's membership-and-loyalty module.
- **Support tickets:** opened in the shop, worked in the ERP's support module.

## 9. Architecture

- **Store service (Go, from go-cqrs-boilerplate, repository `commerce-store-service`):** multi-tenant by host name, one configuration per shop. **It owns what is particular to shops:**
  - shopper sign-in and sessions, per shop and domain, with every sign-in method;
  - the Redis cache: sessions, carts, catalogue pages and rate limits;
  - the payment rails at checkout: it starts each payment with the payment types the shop's settings allow, through the providers the organisation set up in the ERP, and hands every result to the ERP, which records it;
  - shop-specific features: themes and pages served, search, wishlists, reviews collected, back-in-stock alerts, currencies and languages.

  Everything it sells and everything that happens ends up in the ERP through the channel API. Aggregates: shop, cart, checkout, shopper account and session, and order until the ERP accepts it. Its own Postgres for carts, sessions and the read model; a search index fed from the catalogue feed; outbox and idempotent consumers as the boilerplate provides.
- **Store front (React, Next.js, repository `commerce-storefront`):** server-side and incremental rendering so search engines see every product; layered like the ERP web app; theme tokens from Brand settings; WCAG AA; fast on a phone on a slow network; several languages and currencies.
- **Hosting:** shared by default; dedicated containers through a small provisioning service (create, pause, upgrade, retire).
- **Security:** credentials scoped to one shop, sessions bound to the shop's domain, rate limits, signed webhooks; card details never touch the shop (the providers' hosted fields).

## 10. Settings the organisation chooses

- Order acceptance: confirmed at once, as online shops work (default); or held for review.
- **Payment types** the shop accepts (card, bank transfer, pay on delivery, payment link, and others as providers allow), each chosen in the shop's settings.
- Sign-in methods offered; guest checkout; minimum order value.
- Show stock as a number, as in stock / low / out, or not at all; low-stock threshold; share of availability offered to the shop.
- Prices shown with or without tax; currencies and languages.
- Delivery zones, rates, carriers and collection points.
- Company accounts: pay now or credit terms, limits and approvals.
- Reviews (moderated or not), wishlists, back-in-stock alerts.
- Return window and conditions.
- Shopper messages and their channels (email, SMS, WhatsApp); abandoned-cart reminders.
- Numbering for shop orders.
- The domain registrar (Hostinger first; see section 13).

## 11. Permissions

Create a shop; change its assortment, prices and promotions; change its look and content; manage its domain, and buy one (a cost to the organisation); moderate reviews; see its sales; pause or retire it; rotate its credentials.

## 12. Proposed build order

1. **The channel in the ERP** *(built 12 October)*: assortment, locations, sell-from inventory types, prices, availability and reservations.
2. **The channel API and events** *(built 12 October)*, with drills.
3. **The store service and store front** and the "Create online store" button: browse, cart, checkout, orders and payment; a subdomain; many shops per organisation.
4. **Shopper accounts:** every sign-in method, sessions per shop, company accounts with buyers, limits and credit terms, loyalty, returns and support tickets.
5. **Delivery:** the organisation's own zones and rates, then carriers, all set up in the ERP.
6. **Reviews, wishlists and back-in-stock alerts; currencies and languages.**
7. **Domains:** buying a domain through Commerce (Hostinger) and connecting the organisation's own, with automatic certificates.
8. **Dedicated containers.**
9. **Marketplaces** (Jumia, Konga) later, on the same channel API.

## 13. Your answers (12 October) and what is still open

1. **Standalone:** none. The ERP is the only source of truth; a standalone shop would repeat its features.
2. **Content:** edited in the ERP.
3. **Sign-in:** every method (email code, password, phone code, Google, Apple, Facebook); the organisation chooses which to offer. The Go store service manages sign-in, the Redis cache, the payment rails at checkout and what is particular to shops (section 9).
4. **Delivery:** varies by organisation; its own rates and carriers, all set up from the ERP.
5. **New orders:** confirmed at once, as online shops work; a setting holds them for review for organisations that want it.
6. **Company buyers:** the organisation sets pay-now or credit terms.
7. **Reviews, wishlists, back-in-stock alerts:** yes.
8. **Several currencies and languages per shop:** yes.
9. **Separate repositories:** yes.
10. **Domains:** Hostinger domains resold through Commerce, or the organisation's own domain or subdomain. **Checked 12 October:** Hostinger has a developer API for domains (availability, purchase) and DNS records, used with a token from our own Hostinger account. Its Reseller Master Agreement covers reselling its hosting packages and does not clearly cover reselling domains to third parties, and the registrant of each domain must be the organisation itself. So the registrar is a slot: Hostinger's API first, with Hostinger asked in writing to confirm domain reselling; a registrar with an explicit domain reseller programme can fill the slot if they decline. Nigerian domains (.ng, .com.ng) need a NiRA-accredited registrar, so whether Hostinger sells them is also to be confirmed.
11. **Payment types:** chosen in each shop's settings.
