# The restaurant pack

> Status: **steps 1 to 7 built (16 October 2026); follow-ups built 17 October 2026** on `feature/restaurant-2` (live socket, recipe dishes Non-Stock, short-stock choice, prices by order type and time, a sent dish moved between tabs). Code: `src/modules/restaurant` (ERP), with the table service and the kitchen in `commerce-pos` and the web till. Product: the *Industries — Product Document* (Claude Docs), tab "Restaurant". Kernel: [INDUSTRY_PACKS.md](INDUSTRY_PACKS.md).

A restaurant is the shared core plus the restaurant pack: a floor of tables, menus with modifiers, table service on the till, a kitchen display, recipes with food cost, and the measures a restaurant runs by. It serves cafés, bars and counter service as modes of the same layer (settings, not products). Nothing special-cases the core: the pack is switched on per place (`restaurant.*` features), and every route asks the feature resolver first.

## Who owns what

| Part | Owner | Why |
| --- | --- | --- |
| Floors, tables, menus, option groups, stations, routing, recipes, settings, "86" | The ERP | One catalogue, one price book, one source of truth. |
| Tabs, courses, tickets, table state, covers | The till service (`commerce-pos`, Go) | The live service of the tills. |
| Tables as bookable things | The booking engine (`booking.resources`, kind `table`) | One availability engine for rooms, rentals and tables. |

The ERP tells the till what changed with `RestaurantConfig-changed` (`commerce.restaurant.v1`); the till tells the ERP what happened on `pos.restaurant.v1`. Every change travels by the outbox; nothing polls.

## The floor (step 2)

| Table (`restaurant.`) | What it holds |
| --- | --- |
| `floors` | An area (inside, terrace, bar, private room) and the size of its drawing board. Each floor has a booking resource group of kind `area`. Retired, never deleted; refused while tables are on it. |
| `table_layout` | A table's shape (`square`, `round`, `rectangle`), position, size and turn on its floor. Its name, seats, fewest seats and joinable tables are the booking resource's. |
| `table_states` | The ERP's copy of each table's state, kept only when the till's version is newer. |

Tables are created through the booking engine's `ResourceService` (so a table is something a guest can be booked at), drawn where there is room (first free spot on a 20-unit grid) and checked: on the floor, at least 20 × 20, round means as wide as high, never on top of another. A drag of many tables is saved together (`PUT floors/:id/layout`) or refused with nothing moved. A table with a party at it (any state except `free` and `to_clean`) cannot be retired.

**States**: `free`, `seated`, `ordered`, `waiting_food`, `eating`, `bill_asked`, `paying`, `to_clean`. The till owns them. *Booked soon* is not stored: it is a free table with a reservation starting within the hour, read from the booking engine when the plan is read.

### API (`/api/v1/restaurant`)

| Method, path | Permission | What |
| --- | --- | --- |
| `GET floors?locationId` | `restaurant.floor.read` | A place's floors. |
| `POST floors`, `PATCH floors/:id`, `POST floors/:id/retire\|reinstate` | `restaurant.floor.manage` | Make, rename or resize, retire. |
| `PUT floors/:id/layout` | `restaurant.floor.manage` | Save a drag, all or nothing. |
| `GET floor-plan?locationId` | `restaurant.floor.read` | Every floor with its tables, state, and the reservation about to start. |
| `POST tables`, `PATCH tables/:resourceId`, `POST tables/:resourceId/retire\|reinstate` | `restaurant.floor.manage` | Add, change (seats, shape, floor, position) or retire a table. |

A person attached to locations works those; `restaurant.floor.manage` reaches every place. Reads and writes first ask `FeatureResolver.require(org, location, 'restaurant.floor')`.

### Events

`RestaurantFloor-created|updated`, `RestaurantTable-created|updated` (live entity notices), `RestaurantConfig-changed` (`scope`: floor, menus, stations, recipes, settings; the tills read their configuration again). The till's `restaurant.table.state_changed` (`organizationId`, `locationId`, `tableId`, `state`, `since`, `covers`, `tabId`, `reservationId`, `guestName`, `waiterId`, `version`) arrives on `pos.restaurant.v1`. Booking moments (`BookingReservation-checked-in` …) carry `resourceIds`, `guestName`, `reservationKind` so the till can seat the tables a checked-in reservation holds.

### Screens (commerce-web `features/restaurant`)

**Restaurant → Floor** (`/restaurant/floor`): every table of the place where it stands, in the colour *and words* of its state with how long it has been there, a strip of counts and guests seated, floors as tabs; follows the server (`RestaurantTable`, `RestaurantFloor`), no refresh button. **Restaurant → Draw the floor** (`/restaurant/floor-plan`): add floors and tables in drawers, drag a table or select it and use the arrow keys (Shift for a bigger step), snapped to the grid and kept on the board, saved together; Edit and Retire behind an Actions menu.

## Menus (step 3)

A **dish is a catalogue product** (`item.variant`), priced by the sales pricing rule at the place (`MenuPricing` asks the same `SalesPricingService.resolve` every sales document asks, so a menu never keeps a price of its own); a **menu is a published arrangement of dishes**, so one dish can sit on several menus.

| Table (`restaurant.`) | What it holds |
| --- | --- |
| `menus`, `menu_locations` | À la carte, set, breakfast, lunch, dinner, drinks, children's, events: the days and hours served (`schedule`, a week of `HH:mm` ranges as in the booking engine's hours; empty: always) and the places that serve it. A code is unique among active menus. Retired, never deleted. |
| `menu_sections` | Starters, mains, drinks in the organisation's order; each has the course its dishes are served as. Refused to retire while it has active dishes. |
| `menu_items` | A dish on a menu: the catalogue item (once per menu), the words guests read, its own course (else the section's), the station that makes it (step 5), allergens (the fourteen: celery, gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, nuts, peanuts, sesame, soya, sulphites) and dietary tags (vegetarian, vegan, halal, kosher, gluten free, dairy free), calories, spice level 0-3. At most 1000 dishes a menu. |
| `option_groups`, `options`, `item_option_groups` | "How is it cooked" (pick one, required) or "extras" (up to three, optional): the fewest and most to pick (1 or more is required), options each with the price they add (never negative), an optional catalogue item they use up (extra cheese, for recipes in step 6) and a default. A group on dishes is not retired; the options a required group needs cannot be retired. |
| `availability` | What is sold out ("86") at a place: a dish (by its catalogue item, so on every menu) or an option, who said so, why, and an optional end. |

Pure rules in `menu.logic.ts` (specced): whether a menu is served at an instant in the place's zone, group limits, whether a choice from a group is allowed (the till applies the same), the price of a dish with its options (decimal.js), courses.

### "86"

`PUT /restaurant/availability` (`restaurant.availability.manage`) marks a dish or an option sold out, or back. The ERP is the one writer (a till asks it, so there is no second copy to disagree); the answer travels whole as `RestaurantAvailability-changed` (`commerce.restaurant.v1`: `locationId`, `refKind`, `entityId`, `soldOut`, `reason`, `until`, `version`) for tills and kitchen screens to apply as it is, and as an entity notice for open screens. An "until" is applied by the reader against the clock: nothing runs when it passes.

### API (`/api/v1/restaurant`)

| Method, path | Permission | What |
| --- | --- | --- |
| `GET menus?locationId&active&search`, `GET menus/:id?locationId` | `restaurant.menus.read` | Menus; one menu with sections and dishes, priced at a place. |
| `POST menus`, `PATCH menus/:id`, `POST menus/:id/retire\|reinstate`, `PUT menus/:id/locations` | `restaurant.menus.manage` | Make, change, retire, say which places serve it. |
| `POST menus/:id/sections`, `PATCH menu-sections/:id`, `POST menu-sections/:id/retire\|reinstate` | `restaurant.menus.manage` | Sections. |
| `GET lookups/dishes?search`; `POST menu-sections/:id/items`, `PATCH menu-items/:id`, `POST menu-items/:id/retire\|reinstate`, `PUT menu-items/:id/option-groups` | read / manage | Dishes from the catalogue. |
| `GET option-groups`, `POST option-groups`, `PATCH option-groups/:id`, `POST option-groups/:id/retire\|reinstate`, `POST option-groups/:id/options`, `PATCH options/:id` | read / manage | Option groups and options. |
| `GET availability?locationId`, `PUT availability` | `restaurant.menus.read` / `restaurant.availability.manage` | What is sold out; mark or bring back. |

Every route first asks `FeatureResolver.require(org, place, 'restaurant.menus')`. Events: `RestaurantMenu-*`, `RestaurantOptionGroup-*`, `RestaurantAvailability-updated|changed`, and `RestaurantConfig-changed` (`scope: menus`) for each place that serves the menu (every place that carries the pack, for a shared option group).

### Screens

**Restaurant → Menus** (list: kind, hours in words, places, dish count; New menu in a drawer with a weekly hours editor), **a menu** (sections, dishes with course, allergens, option groups and price; Add a dish in a drawer that searches the catalogue; Actions menus), **Options** (groups and options with limits in words), **Sold out** (the "86" board with a dish finder and Bring back). All follow the server.

### Not yet (menus)

Photos, languages.

## The kitchen (step 5)

A **station** is a place in the kitchen (or the bar) that makes dishes and has a screen: grill, cold section, bar, pass. It belongs to one place, has a short code (unique there), a kind (`kitchen`, `bar`, `pass`, `other`) and is retired, never deleted; it cannot be retired while a dish names it or a rule sends to it. **Routing** says which station makes what, for a place: by **dish** (the catalogue item), by catalogue **category**, by **course**, or a **default**. A dish's own station (set on the menu) beats every rule; the most specific rule beats a general one (item, then category, then course, then default); a higher priority breaks a tie; with no rule the first station makes it. At most one default is on. The rules are saved as a whole set, all together or not at all. "Set up a kitchen and a bar" gives a place with no stations a Kitchen, a Bar and drinks going to the bar. The till applies the same order (`StationFor` in `commerce-pos`); the preview on the set-up screen applies it here to every dish of the place.

The kitchen display itself lives with the till (`commerce-pos` `docs/RESTAURANT.md`, the web till's Kitchen screen): a ticket per station per send, dishes ticked ready, bump and recall, ages that turn amber and red (`warnMinutes`, `lateMinutes`), course pacing, all live. The tills' configuration carries the stations, the rules and each dish's **category** (`items[].categoryId`).

### API (`/api/v1/restaurant`)

| Route | Permission | Does |
| --- | --- | --- |
| `GET stations?locationId&includeRetired`, `POST stations`, `PATCH stations/:id`, `POST stations/:id/retire\|restore`, `POST stations/defaults` | `restaurant.kitchen.read` / `manage` | Stations of a place (with how many dishes and rules use each). |
| `GET routing?locationId`, `PUT routing?locationId` | read / manage | The rules; replace the whole set. |
| `GET routing/preview?locationId` | read | Which station each dish goes to. |
| `GET lookups/categories?search` | manage | Catalogue categories by name, for a rule by category. |

Every route first asks `FeatureResolver.require(org, place, 'restaurant.kitchen')`. Events: `RestaurantStation-created|updated` (open screens), `RestaurantConfig-changed` (`scope: stations`; the tills read the place again). Migration `1782800000400`.

### Screens

**Restaurant → Kitchen** (stations table with kind, dishes and rules using each, a drawer to add or change one, Actions menu; the routing rules as rows to edit and save together; "Where each dish goes" preview; "Set up a kitchen and a bar" where there is none).

## Recipes, stock and waste (step 6)

**A recipe** says what one batch of a dish uses and how many portions it makes (one active recipe per dish). Each ingredient is a catalogue item with a quantity **in the unit the kitchen weighs in** (kilograms, a carton) and the share **lost in preparation**; the quantity is kept beside its value in the item's **base unit** as it was settled (UNIT_OF_MEASURE.md): everything below adds `base_quantity`, never the entered number. An ingredient may have a recipe of its own (a sauce, a dough); it is broken down in turn, four levels deep at most, never in a circle. For a sub-recipe the "portion" is one base unit of the item (a sauce that makes 1000 ml has a yield of 1000, and a dish uses 150 of it).

**Taking stock out.** The moment the kitchen starts a dish (the till's `restaurant.tab.sent`, which now names the dishes) its ingredients leave stock, drawn from the inventory types the place names (`ingredientInventoryTypeIds`; empty: every type not held for work orders), one ledger document per send (`sourceType RestaurantKitchen`, keyed by the tab and the round, so a send read twice takes stock once). Options that are stock items (extra cheese) are taken one for each portion. A dish nobody paid for, or one voided or comped afterwards, has used them already; a dish **with no recipe** (a bottled drink) is sold from stock by the sale, the ordinary way. The kitchen is never stopped by short stock: it goes below zero, the run keeps which ingredients are short, and **Kitchen → Stock problems** shows it. A dish with a recipe is itself an item that is not counted (type Non-Stocked): see *Recipe dishes are Non-Stock* below. Turn the whole thing off with `consumeIngredients`.

**Cost and margin.** A dish's cost is its ingredients, broken down, each at the cost stock holds it at the place (moving average or first in first out, as the books say; the organisation's figure when the place has none), against the price the price book gives it there with tax taken out. An ingredient never received has no cost: the dish says so and shows no margin.

**Waste.** Stock lost by hand (spoiled, dropped, expired, a staff meal) takes the item, or a dish's ingredients, out of stock at once and is costed; a loss bigger than the stock is refused (a mistake in the entry). A dish **voided** or **comped** at the till is reported with what it cost to make and what it would have sold for (the till's events now carry the dish); read twice, it is one entry. Void, comp and waste are totalled apart.

**Sold out by itself.** With `autoSoldOut` on, a dish whose ingredients cannot make another portion is sold out on every till and menu ("Out of Tomatoes"), and comes back when stock arrives. A dish a person marked sold out is never touched, and one the restaurant marked is brought back only by the restaurant (`set_by` is empty and the reason starts with "Out of").

### API (`/api/v1/restaurant`)

| Route | Permission | Does |
| --- | --- | --- |
| `GET recipes?search&active&limit&offset`, `GET recipes/:id` | `restaurant.recipes.read` | Recipes; one with its ingredients. |
| `PUT recipes` | `restaurant.recipes.manage` | Make a dish's recipe or replace the one it has (the ingredients as a whole). |
| `POST recipes/:id/retire\|restore` | manage | Retire (refused while another recipe uses the dish) or bring back. |
| `GET dish-costs?locationId` | read | Cost, price, margin, flags per dish at a place. |
| `GET consumption/problems?locationId` | read | Sends whose ingredients could not be taken, or left stock below zero. |
| `GET lookups/ingredients?search`, `lookups/units?variantId`, `lookups/used-in?variantId` | manage / read | Catalogue items; an item's units; where it is used. |
| `GET waste?locationId&from&to&kind`, `GET waste/summary`, `GET waste/reasons`, `POST waste` | `restaurant.waste.record` | Stock lost and dishes voided or comped; record stock lost. |

Settings (`restaurant-service`): `consumeIngredients`, `ingredientInventoryTypeIds`, `autoSoldOut`, `shortStockBehaviour`. Events: `RestaurantRecipe-created|updated`, `RestaurantWaste-created`. Migration `1782800000500`.

### Screens

**Restaurant → Recipes** (the list with ingredient counts; a drawer with the ingredient rows, unit and waste for each, and where an ingredient is used), **Dish costs** (cost, price, margin and the warnings), **Waste** (record stock lost; the list; totals by kind and reason), and the Stock problems notice.

## Recipe dishes are Non-Stock (17 October 2026)

Product document: [restaurant-recipe-stock-type-prd.md](restaurant-recipe-stock-type-prd.md). A dish that has an active recipe leaves stock as its ingredients when the kitchen starts it; if the dish were also counted as a stocked item, its sale would take it out of stock a second time (it goes negative, because finished dishes are never received, and the cost of goods sold is counted twice). So:

| Dish | Save | Dish costs flag |
| --- | --- | --- |
| Has a recipe and is counted in stock | Refused: `400 RECIPE_ITEM_MUST_BE_NON_STOCK` with a message naming the dish and the way out | **Critical error: double depletion risk detected**, with an exclamation icon and the tooltip *This item maps to an underlying recipe. To prevent duplicate depletion errors, toggle its inventory status to Non-Stock.* |
| Has a recipe and is Non-Stock | Allowed; ingredients only leave stock, on send | **Passed: recipe structure healthy** |
| No recipe and counted | Allowed; the dish itself leaves stock on sale | **Passed: standard pre-packaged item** |

*Counted* means the item has a stock record whose inventory type is tracked (Stocked, Finished goods…) at any place.

- **Both doors are shut.** Saving a recipe (or switching one back on) for a counted item is refused (`RecipeStockService.assertCanHaveRecipe`), and so is making a counted stock record for a dish that has a recipe (`InventoryService.create`, through the `InventoryTypeGuards` registry in the stock module, which the restaurant registers at start). A bulk import that places an existing recipe dish in a place as Stocked is not stopped (the Dish costs flag and the fix below find it).
- **A sale never takes a recipe dish out of stock itself.** `StockIssueHooks.exempt` lets a module name items a sale must not issue; the POS sale (and a return) skips a recipe dish's own stock line. Items without a recipe are issued the ordinary way.
- **Dish costs** (`GET dish-costs`) carries `stockCheck` (`state` critical or passed, `label`, `tooltip`) for every dish and also lists dishes on a menu at the place that have no recipe (`recipeId: null`), costed at what stock holds them at.
- **One-click fix** `POST /restaurant/recipes/fix-stock-types` (`restaurant.recipes.fix-stock-type`; owners, administrators and managers) with `{ variantIds? }` (none: every misconfigured dish). For each counted stock record of a misconfigured dish: its count under the counted type is cleared by a ledger adjustment with a reason, the record's inventory type becomes Non-Stocked, and `restaurant.stock_type_fixes` keeps who did it, when, from which type and the quantity cleared (`GET /restaurant/stock-type-fixes`). A place where the dish already has a Non-Stocked record is skipped and named. The screen asks before it does it.
- Drill: `npm run restaurant:stock-type-drill` (13 checks).

## When ingredients are short of stock (17 October 2026)

Setting `shortStockBehaviour` (Restaurant service settings; the organisation's value, a place may override it):

| Choice | What a send does |
| --- | --- |
| Allow and flag (default) | Nothing stops the kitchen; stock goes below zero and the send is listed under **Stock problems** (today's behaviour). |
| Warn the waiter | At send time the till asks the ERP what is short; the send is held with `409 SHORT_STOCK_WARNING` listing the dishes and ingredients (need and what is left); repeating it with `acknowledgeShortStock` sends. |
| Block the send | The same check refuses with `409 SHORT_STOCK_BLOCKED` and names what is short; nothing is saved. |
| Mark the dish sold out | As soon as stock cannot make another portion the dish is "86" on every till and menu (the existing automatic 86, also switched on by the older `autoSoldOut`); a send that still arrives behaves as allow and flag. |

The till calls `POST /api/channel/v1/pos/restaurant/stock-check` (`{ locationId, dishes: [{ lineId, variantId, qty, optionVariantIds }] }` → `{ behaviour, short: [{ lineId, variantId, ingredients: [{ id, name, need, have }] }] }`); it breaks the dishes down exactly as the send will and takes nothing out. Dishes are taken in order from one running balance, so when two want the last of an ingredient the second is the one short. If the ERP cannot be reached the dish is sent and flagged: the kitchen never waits on the network. A course that fires by itself (`courseFiring: automatic`) is never held back. The till's screen shows the list with **Send anyway** (warn) or an OK (block).

## Prices by order type and by time (17 October 2026)

A tab has an **order type**: dine in (the default), takeaway or delivery. Takeaway and delivery are *counter orders* a place chooses to offer (settings `offerTakeaway`, `offerDelivery`); a table or bar tab is always dine in. The order type can be changed while the tab is open: dishes already on it keep the prices they were given (prices are fixed when a dish is added), the next ones follow the new kind. The service charge is dine in only unless `serviceChargeDineInOnly` is switched off.

**Price rules** (`restaurant.price_rules`) change the price the price book gives a dish; the book stays the one list and a rule never keeps a price of its own:

| Field | Meaning |
| --- | --- |
| For | every dish, a catalogue category, or one catalogue item |
| Kinds of order | dine in, takeaway, delivery; none ticked: all |
| Days, hours | days of the week (none: every day); `HH:mm` to `HH:mm` in the place's time zone, the end being the first minute it no longer applies (past midnight: two rules); none: all day |
| Dates | first and last day (inclusive), in the place's zone |
| The change | a fixed price, a percentage off or on top, an amount off or on top (never below nothing) |
| Priority, place | higher wins; a place, or every place that carries the pack |

Of the rules that apply, the highest priority wins, then the one for a dish over a category over everything, then the smaller id; rules do not add up. The ERP checks them and previews them (`GET price-rules/preview?locationId&orderType&at`); the till (Go) applies the same logic when a dish is added, and both pass `price-rule.vectors.json` (`commerce-api` `src/modules/restaurant/pricing/` and `commerce-pos` `internal/domain/restaurant/testdata/`). The tab's line keeps the book price and the rule's name; the POS sale line carries `priceRule`, so the ERP does not report the difference from the book as a price change. The rules in force at a place travel in its configuration (`priceRules`); a change announces `RestaurantConfig-changed` (`scope: pricing`). Options are added to the dish's price after the rule.

| Route | Permission | Does |
| --- | --- | --- |
| `GET price-rules?locationId&active` | `restaurant.menus.read` | The rules. |
| `POST price-rules`, `PATCH price-rules/:id` (all of it, with `version`), `POST price-rules/:id/retire\|restore` | `restaurant.menus.manage` | Make, change, switch off or on. |
| `GET price-rules/preview?locationId&orderType&at` | `restaurant.menus.read` | Book price, price now and the rule, for every dish served at the place. |
| `GET lookups/price-categories?search` | `restaurant.menus.manage` | Categories by name. |

Screen: **Restaurant → Prices** (rules table with an Actions menu, a drawer to make or change one, and *Try it*). The till's menu is priced for the tab's kind of order (`GET /pos/v1/restaurant/menu?orderType=`): a dish priced by a rule shows the book price struck through and the rule's name, and the menu answers `nextChangeAt` (the next moment a menu starts or stops being served or a rule starts or stops) so the screen reads again once then, never on a timer. Drill: `npm run restaurant:price-rules-drill`.

## Set menus and combos (17 October 2026)

A **set menu** is a dish of a menu that asks the guest to choose: a fixed price over groups ("a starter, a main, a drink"), each group with the fewest and most to pick, the dishes to choose from, an **upgrade** surcharge on a dish (the steak instead of the chicken costs a little more), the dishes ticked to start with, and the course its dishes are served as. The set itself is a catalogue item priced by the price book like any dish (so its price follows the sales pricing rule and any price rule); its choices are other plain dishes of the restaurant's menus.

| Table (`restaurant.`) | What it holds |
| --- | --- |
| `combo_groups` | A choice of a set menu: the menu item it hangs on, a name, the course, fewest and most to pick. |
| `combo_choices` | A dish offered in a choice (another menu item), its surcharge, whether it starts ticked. |
| `combo_dish_facts` | What the reports are made of: one row for each dish of a set the kitchen was sent (from `restaurant.tab.sent`), keyed by the till's line, with the share of the set it came to and `weight` (1 over the dishes of the set), so a set counts once however many dishes it has and a send read twice is the same facts. |

Rules (`combo.logic.ts`, specced): at least one choice and at most 20; each named once; the fewest is 0 or more, the most 1 or more and not below the fewest; every choice offers at least as many dishes as it asks for (at most 60); no dish twice in a choice; an upgrade is never negative; no more dishes ticked to start with than can be picked. Beyond those, the service checks that every dish is a plain, active dish on an active menu (**a set cannot be a choice of another set, nor of itself**), that the set has no option groups of its own, and that **a dish that is a choice cannot be taken off the menu** from under the set (take it out first).

| Route | Permission | Does |
| --- | --- | --- |
| `GET menu-items/:id/combo` | `restaurant.menus.read` | A dish's choices with the dishes' names (none: a plain dish). |
| `PUT menu-items/:id/combo` | `restaurant.menus.manage` | Make the dish a set menu, or change its choices as a whole (`{ groups: [{ name, course?, minChoices, maxChoices, choices: [{ menuItemId, surcharge?, isDefault? }] }] }`); no groups turns it back into a plain dish. |

Menu detail answers `isCombo` for each dish. The tills' configuration carries `combo` on a set's item (`groups[].choices[].itemId` naming other items of the same configuration). **At the till** the set's price is shared over the dishes chosen in proportion to what each costs alone, to the currency's unit and exactly; each dish is a line of its own, goes to its own station and course, is made, ticked, served, voided, counted in stock (a recipe dish through its ingredients) and reported like any dish, and splits on a bill. The kitchen ticket names the set; the ERP hears, for each dish of a set, `comboId`, `comboItemId`, `comboName`, `comboSize` and `amount`. **Reporting**: KPI `restaurant.set_menus` (sets sold) and the report **Set menus** (`restaurant.set_menus`, by set, dish or day: sets, dishes, what they came to). Screen: **Restaurant → Menus → a menu → Actions → Set menu…** (a drawer to add choices, tick dishes, set upgrades and the course); a dish that is a set carries a badge.

## Tips (17 October 2026)

Tips are never revenue. The till keeps them apart from the sale and tells the ERP, when a tab closes, how much was given (`tips`) and how much of it in cash (`tipsCash`); `restaurant.tab_facts` keeps both with the waiter. The ERP shares a period's tips out in **runs** and pays them.

| Table (`restaurant.`) | What it holds |
| --- | --- |
| `tip_policies`, `tip_policy_roles` | How a place shares tips: `individual` (each waiter keeps their own tables' tips) or `pool` (everyone's tips into one pool shared by `hours`, by the role's `points`, or `equal`), the house's share (%), a card's fee (% of the tips that did not come in cash), how people are paid by default (cash or payroll), and the roles with their points (a waiter 1, a runner 0.5). Organisation-wide or for one place. |
| `tip_roster` | Who takes part in a place's tips and as what (a staff member with an account; one active entry for a person at a place); a person may be paid differently from the policy's default. |
| `tip_runs`, `tip_allocations` | A period's tips shared out: the figures as they were when the run was made (taken in cash and by card, fee, the house's share, what is shared out), and each person's share with hours, points, how they are paid and whether they have been. |
| `tab_facts.tips_cash`, `tab_facts.tip_run_id` | The part of a tab's tips given in cash, and the run that took the tab's tips so no tip is shared twice. |

**A run** (`POST tip-runs {locationId, policyId, from, to}`): the tabs closed in those days (the place's own days) with tips that no run has taken are claimed by the run; the card fee comes off the card tips, the house's share off the rest, and what is left is shared **to the cent** (the leftover cents go to the largest remainders, so the shares always add up). In a pool by hours the hours come from the timeclock (`human_resource.attendances`, by the person's staff record) and can be corrected on the draft (`PUT tip-runs/:id/hours`, which shares again); a pool with no hours, or nobody on the roster, shares nothing and says why instead of inventing a split. A draft is read before anything moves. **Approving** (`restaurant.tips.payout`) records the tips owed in the books; **paying cash** (`POST tip-runs/:id/pay-cash`) marks the cash shares paid and posts the payout; shares for people paid **through payroll** wait for the next payroll run. **Voiding** a run nothing was paid from gives its tabs back (and reverses its entry when it was approved). A run closes as paid when nothing is waiting.

**The books** (`TipLedgerService`, a `LedgerPoster` so a posting the books refuse waits in the backlog): approving a run is Dr cash (tips given in cash), Dr cash in transit (card tips less the fee), Cr **tips owed to staff** (`tips_payable`, 2460) for what is shared out and Cr **tips kept by the house** (`tips_house_income`, 4830) for the house's share; cash paid out is Dr tips owed to staff, Cr cash. Both accounts and roles are added to every chart (migration `1782800001300`).

**Payroll**: the payroll module gained `PayrollExtraEarnings`, where a module registers pay it owes through payroll. The restaurant registers `TipPayrollProvider`: when a run is calculated, each person's waiting payroll shares are added to their line as the **Tips** salary component (made the first time; not taxable by default), and the payroll ledger books a Tips component against tips owed to staff instead of salaries (it was never the employer's expense); when the run is **paid**, exactly the shares its lines carried are marked paid (a share approved after the run was calculated waits for the next one). Staff with no salary structure have no payroll line, and a person without a staff record is paid in cash.

| Route | Permission | Does |
| --- | --- | --- |
| `GET tip-policies`, `POST tip-policies`, `PATCH tip-policies/:id`, `POST tip-policies/:id/retire\|restore` | `restaurant.tips.view` / `manage` | Policies (change all of one, with `version`). |
| `GET tip-roster?locationId&includeLeft`, `POST tip-roster`, `PATCH tip-roster/:id`, `GET lookups/tip-people?search` | view / manage | The roster and the staff who could join it. |
| `GET tip-runs?locationId&status`, `GET tip-runs/:id`, `POST tip-runs`, `PUT tip-runs/:id/hours` | view / manage | Runs, one with each person's share, share a period, correct a draft's hours. |
| `POST tip-runs/:id/approve`, `POST tip-runs/:id/void`, `POST tip-runs/:id/pay-cash` | `restaurant.tips.payout` | Approve, void, pay the cash shares. |
| `GET tips/mine` | `restaurant.service.read` | What the signed-in person was shared (for their own screen). |

Permissions: `restaurant.tips.view|manage|payout` (managers view and manage; owners and administrators also approve and pay; seed `1782800001001`). Report **Tips shared out** (`restaurant.tips_shared`, `restaurant.tips.view`): by person, role, how paid, state, period. Screen: **Restaurant → Tips** (runs with a detail drawer to approve, pay and correct hours; policies; the roster).

## A sent dish moved between tabs (17 October 2026)

Moving a dish that the kitchen already has used to leave its ticket behind: marking it ready updated the old tab and a later void never reached the kitchen screen. Now the ticket follows the dish. A ticket of one dish moves whole; otherwise the dish is taken onto a ticket of its own for the new table with the same station, round, arrival time and ready state (bumped if its ticket was). The new tab's line keeps its status, a table that was only seated becomes ordered, and `restaurant.ticket.line_moved` goes to the ERP so the kitchen-time facts carry on (a ticket that moved whole now belongs to the new tab; a new ticket is a fact with the original arrival time). A retargeted ticket also updates its `tab_id` column (a merged tab's tickets were not found by tab before).

## The measures (step 7)

`restaurant` is an analytics module, so the dashboards, the reports page, exports, schedules and alerts all know it (`restaurant.dashboard.view`, `restaurant.report.view`…; managers and viewers read, owners and administrators hold all). The measures are made of **facts the till's events keep** (`pos.restaurant.v1`), written as upserts that merge, so an event read twice or out of order changes nothing: `restaurant.tab_facts` (a tab's guests, tables, bill, tips, service charge, dishes, voids and comps, when it opened and was paid) and `restaurant.ticket_facts` (when a kitchen ticket was sent, its first dish ready, finished, recalled). Voids, comps and stock lost are `waste_entries` (step 6). A paid tab, a finished ticket and a void or comp announce `RestaurantService-updated`, so open dashboards and cached reports read again.

| KPI | Meaning |
| --- | --- |
| `restaurant.covers` | Guests of the tabs paid in the period. |
| `restaurant.tabs_paid` | Parties that settled (tables, bar and counter). |
| `restaurant.spend_per_cover` | Bills ÷ guests. |
| `restaurant.average_tab` | Bills ÷ tabs. |
| `restaurant.tips` | Tips, apart from sales. |
| `restaurant.table_turns` | Table tabs paid ÷ tables in service ÷ days. |
| `restaurant.table_time` | Minutes from a tab opening to its payment, table tabs. |
| `restaurant.kitchen_time`, `restaurant.first_dish_time` | Minutes from a ticket being sent to its station finishing it, and to its first dish ready. |
| `restaurant.voids`, `restaurant.comps`, `restaurant.waste` | What voided and comped dishes would have sold for; what stock lost cost. |

Reports (`/analytics/reports`): **Tabs paid** (by day, kind or waiter), **Kitchen times** (by station, course, day or hour), **Voids and comps**, **Stock lost**. Each is held to the places the reader may see, and filters, groups, exports and schedules work as for every report. Dish cost and margin is `GET dish-costs` (it needs the recipe's explosion, which is not a column).

## Permissions

`restaurant.floor.read|manage`, `restaurant.menus.read|manage`, `restaurant.availability.manage`, `restaurant.service.read`, `restaurant.kitchen.read|manage`, `restaurant.recipes.read|manage|fix-stock-type`, `restaurant.waste.record`, `restaurant.reports.read` (seed `1782800000001`). Owners and administrators hold all; managers read and run the floor, menus, kitchen and waste; viewers read. Role templates **Waiter**, **Host**, **Chef**.

## Tests

`floor.logic.spec` (placement, overlap, free spot, codes, size), `menu.logic.spec` (hours served, limits, selection, price), `kitchen.logic.spec` (routing precedence, rule checks, codes), `recipe.logic.spec` (breaking a dish down, loops and depth, cost and margin, what stock can still make), web `floor.model.spec` and `menu.model.spec`. `npm run restaurant:drill`: the pack gate, floors and tables as booking resources, every refusal, a drag all-or-nothing, the till's word taken only when newer, the retire rules, the events. `npm run restaurant:service-drill` (19 checks): the till's events as facts (read twice, out of order, a recalled ticket), every KPI against the same sum made another way, the four reports. `npm run restaurant:recipes-drill` (34 checks): a recipe with a sauce inside it and a unit that is not the base, every refusal, a send taking the right ingredients out exactly once (options included, by the till's own event), short stock kept for a manager, cost and margin, stock lost, voids and comps once however often read, "86" by itself and given back. `npm run restaurant:kitchen-drill` (19 checks): stations and their codes, every routing refusal, the whole-set save, the preview in each precedence, retiring refused while used, the tills' configuration, the events. `npm run restaurant:menus-drill` (28 checks): menus with hours and places, sections and courses, dishes (once to a menu, allergens), option groups with limits and prices and every rule on retiring, "86" a dish and an option, the events.

## Deferred tests (test lane)

E2E route specs for `/restaurant/*` and `/packs/*`; tenancy-sweep fixtures; stubbed Cypress (floor, draw the floor with drag and keyboard, axe on each) and a live Cypress for the whole service.

## History

- 16 October 2026: step 1 (the kernel) and step 2 (the floor and tables).
- 16 October 2026: step 3 — menus, option groups, hours and "86". Migration `1782800000200`.
- 16 October 2026: step 5 — stations and routing for the kitchen display (the display and tickets are the till's). Migration `1782800000400`.
- 16 October 2026: step 6 — recipes, stock taken when a dish is sent, waste, dish cost and margin, "86" by itself. Migration `1782800000500`.
- 16 October 2026: step 7 — covers, spend, table turns, kitchen times, voids, comps and waste as KPIs and reports. Migration `1782800000600`.
