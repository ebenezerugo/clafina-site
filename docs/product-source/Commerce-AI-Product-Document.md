# Commerce AI — Product Document

*Live document: https://claude.ai/artifact/FMHjZEDcojRnJY8pJgJe42 (this file is its copy as of 12 October 2026). It carries forward the Capture document (`Capture-Product-Document.md`).*

**Status:** Draft 1, 12 October 2026. It grows out of the Capture draft (scans and voice for data entry), which stays as it is for reference, and folds in your answers to its questions. Your answers to this document's own questions are in section 13.

## 1. Summary

Commerce builds and runs its own AI, so organisations never have to bring an AI provider or an API key. One internal AI service reads scans and photos, listens to voice notes, answers questions from the organisation's own records and documents, writes reports on request, and operates the application through the same tools a person uses. It runs on open models we host and improve ourselves, in a separate Python service with its own infrastructure, beside Commerce the way the wallet system is.

## 2. Decisions so far

- **Commerce's own AI by default.** Commerce provides OCR, speech, language models and search as part of the platform, so no organisation needs an AI API. An organisation that wants its own provider (for example Claude or OpenAI under its own contract) can plug it into the AI provider slot instead.
- **Open models, self-hosted, then trained by us.** We start from openly licensed models, host them on our own infrastructure, and fine-tune them for Commerce's documents, languages and tasks.
- **A separate service in Python,** with its own repository, database and infrastructure, like the wallet system. Commerce calls it; it never reads Commerce's tables.
- **Every capability, everywhere:** capture (scans, photos, PDFs, voice, Drive files, messaging channels), chat with the organisation's data, reports on request, and actions across the application through MCP.
- **Languages:** start with Nigerian English, Pidgin, Yoruba, Igbo and Hausa; open to any language by the organisation's location and settings.
- **Messaging channels as integrations, like payments:** WhatsApp, Telegram, TikTok and other platforms' business features, each connected by the organisation (per location if it wishes), and each able to feed capture.
- **Retention and limits are the organisation's to set,** per location or however it chooses.
- **Where to start:** where it is best, covering everything in the end (proposed order in section 12).

## 3. What Commerce AI does

| Capability | What the person sees |
| --- | --- |
| Capture | "Fill from a document" and "Dictate" on every form; "Create from this file" on any Drive file; a Capture inbox fed by email and messaging channels |
| Ask | A chat that answers from the organisation's records and documents, with links to the sources |
| Reports on request | "Show me sales by location this quarter against last" becomes a table or chart that can be saved as a report or dashboard widget |
| Act | "Raise a purchase order to Golden Foods for 200 cartons" becomes a draft the person confirms, through the same tools and rules as the screens |
| Assist | Suggestions inside forms: the likely supplier, the usual price, a missing field |

**Rules that hold everywhere:** the AI acts as the person using it, with their permissions and location scope; it prepares drafts, never postings, unless the organisation's settings say otherwise for a given action; anything irreversible asks for confirmation; every read, suggestion and action is audited; what it says comes with where it came from.

## 4. Capture

Everything in the Capture draft stands (the six-step flow, one schema per document type, matching to the organisation's records, side-by-side review, originals kept on the document, learning from corrections), with these additions:

- **From Drive:** any file in Drive can be used to create a document ("Create from this file": a bill from a scanned invoice, a sales order from a customer's PDF order), and "Fill from a document" on a form can pick a file from Drive as well as upload one. The document keeps a Drive reference to the file it came from.
- **From messaging channels:** photos, documents and voice notes sent to the organisation's WhatsApp, Telegram, Instagram, Facebook Messenger or TikTok business accounts land in the Capture inbox as drafts waiting for review, when the organisation turns that on for that channel and location.
- **Readers are ours:** OCR, layout reading and speech recognition run inside Commerce AI; no organisation needs a cloud OCR or speech account.
- **First targets:** supplier bills and expense receipts (most often keyed by hand, the easiest to check: totals, VAT, supplier), then delivery notes and goods receipts, then sales orders and quotations by voice, then everything else.

## 5. Ask: chat with the organisation's data, and reports on request

- **A chat panel in the application** answers questions such as "Which customers owe more than 90 days?" or "What did we pay Golden Foods this year?" from the organisation's records, and "What does our returns policy say?" from its documents.
- **Reports on request:** the request is turned into a query over the reporting layer Commerce already has (Phase 5.5 report definitions and read models), never into raw SQL against the database. The answer comes as a table or chart, can be refined by talking ("by month", "only Lagos"), and saved as a report or a dashboard widget.
- **Permission-aware:** a person only gets answers from data they may see on the screens: same permissions, same location scope, same hidden fields.
- **Sources shown:** every answer links to the records, reports or documents it came from.

## 6. Act: the whole application through MCP

- Commerce exposes every operation as MCP tools (read and write tools already exist from Phase 4.6; they are completed for every module, one tool per use case).
- The AI calls those tools as the signed-in person. It cannot do anything the person could not do on a screen.
- **Writes become drafts** for the person to confirm; postings, payments, approvals and anything irreversible always ask first, and the document's own approval rules still apply.
- **Multi-step work** ("receive everything on PO-0412 and bill it") is shown as a plan the person approves step by step or at once.
- **Audit:** every tool call is recorded with the person, the request that led to it and the result.

## 7. Knowledge: retrieval over the organisation's own content (RAG)

- **What is indexed:** Drive files the organisation allows, document text (quotations, invoices, contracts, policies), notes and comments, product descriptions, and Commerce's own help, all per organisation.
- **Vector store: a dedicated vector database, run as its own service** (decided 12 October), beside Commerce AI the way Commerce AI sits beside Commerce. Recommended: Qdrant (Apache 2.0, written in Rust, light enough for a laptop, with filtering and multi-tenancy built in), with the organisation id on every entry and enforced on every query. Weaviate (BSD) and Milvus (Apache 2.0) are the alternatives; Milvus is heavier to run.
- **Isolation:** one organisation's content is never retrievable by another, and never used to answer another's question.
- **Access at answer time:** retrieved items are checked against the asking person's access in Commerce before they are used, so a document they cannot open is never quoted to them.
- **Freshness:** Commerce's events (outbox and Kafka) tell the AI service what changed, so the index follows the records.


### 7.1 The assistant: one conversation for voice, documents, reports and actions (your request, 14 October)

*As a user, I send Commerce a voice note of a meeting, and it produces the documents and next steps the meeting needs. In the chat I can open each document, keep talking to change it, and ask for any report or data, as I would with an LLM.*

1. **Send anything into the conversation:** a voice note (recorded in the app or forwarded from WhatsApp), a typed question, a photo, a file from Drive.
2. **It listens and understands:** the voice note is transcribed (speaker turns, Nigerian English first, then the other languages) and summarised: who was there, what was decided, what was agreed with whom, what must happen next.
3. **It proposes the documents the meeting implies,** each as a draft through the ERP's own use cases, never posted: meeting minutes; a quotation or sales order; a purchase order or request for quote; tasks with owners and due dates; calendar follow-ups; emails or WhatsApp messages ready to send. It asks when something is unclear instead of guessing.
4. **Each document appears as a card in the chat:** open it in place or in its own page, see what it was built from (the moment in the recording), and say what to change; the draft is revised and the history kept.
5. **Nothing leaves without a person:** sending, posting, ordering or paying always needs an explicit confirmation by someone with the permission; the assistant acts only as the person asking, within their permissions and locations.
6. **Ask for reports and data in the same chat:** answered from the organisation's own data as a sentence, a table or a chart, traceable to the records, and savable as a report or dashboard widget.
7. **The conversation is remembered** per person, searchable, shareable with a colleague; retention follows the organisation's setting.

Built from voice (step 4), knowledge and the chat panel (step 6), reports on request (step 7) and acting through the MCP tools (step 8), delivered together as one assistant.

## 8. Choosing the models

You suggested DeepSeek and asked for better options for the US market. DeepSeek's open models are strong and cheap to run, and self-hosting them keeps data on our servers. The risk is not the data path but the buyer: US government bodies and a number of US states have banned DeepSeek on official devices, large US companies increasingly screen suppliers for Chinese-origin AI, and the rules may tighten. The same applies to Alibaba's Qwen. For a product meant to sell in the US, the default should be a US or European model with a permissive licence, behind a gateway that lets us swap models without changing Commerce.

| Family | From | Licence | Good for |
| --- | --- | --- | --- |
| OpenAI gpt-oss (larger and smaller sizes) | US | Apache 2.0 | Reasoning, tool use through MCP, reports on request |
| Mistral open models | France (EU) | Apache 2.0 for most open releases | Extraction, multilingual text, EU buyers |
| IBM Granite, Granite-Docling | US | Apache 2.0 | Enterprise documents, turning scans into structured text |
| Meta Llama | US | Llama community licence (conditions apply) | General use; many fine-tunes, including N-ATLaS |
| Google Gemma | US | Gemma terms | Small and vision models |
| N-ATLaS (Nigeria, built on Llama) | Nigeria | to be checked | Yoruba, Igbo, Hausa and Nigerian English |
| DeepSeek, Qwen | China | MIT / Apache 2.0 | Strong and cheap; held back for the US-market reason above |

**Recommended:** a model gateway in the AI service; a gpt-oss model as the default for chat, reports and actions; a smaller Apache-licensed model for extraction; a document model (Granite-Docling class) for layout; N-ATLaS or a Llama fine-tune evaluated for the Nigerian languages. Before choosing, run every candidate on our own test set of Nigerian documents, receipts and voice notes, and pick on measured accuracy, speed and cost. Versions and licences move quickly, so they are checked again when each step is built. (For now, per your answer, we use what we have: Llama through Ollama; see section 13.)

**Readers:** OCR from Apache-licensed engines (docTR, Tesseract, olmOCR, Granite-Docling); speech from Whisper (MIT licence) fine-tuned for Nigerian accents and languages, with NVIDIA's openly licensed speech models as a second candidate. Meta's MMS speech models are excluded: their licence forbids commercial use.

### 8.1 Frameworks and tools

**PyTorch or TensorFlow?** Both are free and open source (Apache-style licences, from Meta and Google). PyTorch is recommended as the base:

- nearly every open model we would use (gpt-oss, Llama, Mistral, Granite, Whisper, the document models) is published for PyTorch first;
- the serving engines we would run (vLLM and its peers) are built on it;
- Hugging Face's training libraries are PyTorch-first.

TensorFlow stays for where it is strongest: running small models on phones (TensorFlow Lite, now LiteRT) for offline camera capture, and any model only published for it. docTR, the OCR engine, supports both.

**Hugging Face** is the hub and toolkit around the models, not a provider we depend on at run time:

- *Transformers:* loading and running language, vision and speech models through one interface.
- *Datasets:* our labelled Nigerian receipts, invoices and voice notes, versioned.
- *PEFT (LoRA) and TRL:* cheap fine-tuning and preference training on our own GPUs.
- *Accelerate:* training across several GPUs.
- *Sentence-transformers:* the embedding models behind search.
- *The Hub:* where we find models. We copy every model we use into our own registry, so nothing breaks if a model is withdrawn or the Hub is unreachable.

**Vision for documents** (mostly found on Hugging Face):

| Need | Candidates | Licence |
| --- | --- | --- |
| Page clean-up (de-skew, crop, contrast) | OpenCV | Apache 2.0 |
| Text and layout from a page | docTR, Tesseract, PaddleOCR, olmOCR, Granite-Docling | Apache 2.0 |
| Handwriting | TrOCR, fine-tuned on Nigerian receipt books | MIT |
| Tables of line items | Table Transformer | MIT |
| Reading a page straight into fields | Donut, Florence-2, Granite-Docling, vision versions of the chosen language model | MIT / Apache 2.0 |
| Stamps and signatures | A small detector (DETR or YOLO class) trained on our pages | Apache 2.0 for DETR; YOLO's common versions are AGPL, so avoided |

Not used because their licences forbid commercial use: LayoutLMv3 (CC BY-NC-SA) and Meta's MMS speech models.

**Speech:** Whisper through faster-whisper (MIT) for speed, and NVIDIA NeMo (Apache 2.0), both fine-tuned for Nigerian accents and languages.

**Serving:**

- vLLM (Apache 2.0) for the language models;
- NVIDIA Triton (BSD) or ONNX Runtime (MIT) for vision and speech models;
- llama.cpp (MIT) for small models on CPU and developers' laptops.

**Around the models:**

- FastAPI for the service's API;
- Ray (Apache 2.0) to spread work across GPUs;
- MLflow (Apache 2.0) to track experiments and register model versions;
- Label Studio (Apache 2.0) for our team to label documents and audio;
- the dedicated vector database (Qdrant), as in section 7.

Every library and model is licence-checked before it is adopted, and the result is recorded in the service's repository.

## 9. The service

- **Commerce AI**, a Python service in its own repository with its own infrastructure, like the wallet system.
- **Inside it:** an API Commerce calls (capture jobs, chat, reports, actions); the model gateway; model serving (Ollama on the Mac now, vLLM-class servers on GPUs in AWS later); OCR and speech pipelines; a client of the vector database service; an MCP client that calls Commerce's MCP tools as the user; usage metering per organisation; an evaluation harness.
- **Talking to Commerce:** Commerce sends jobs and receives results through its API and events; the AI service never reads Commerce's database. Results land in Commerce as drafts through the same use cases the screens use.
- **Infrastructure:** GPU servers for the models, sized for the default model first; queueing so a burst of scans waits rather than fails; a small CPU tier for OCR clean-up and light models; separate staging and production.
- **Where it runs:** on your Mac for now (9.1). Later on AWS, deployed with infrastructure as code, close to Commerce's production, with hosting in Nigeria as an option for organisations that need their data kept in the country.

### 9.1 Running locally on the Mac, for now

Your machine is an M4 Pro with 24 GB of memory shared by the processor and the graphics, about 230 GB free, and Ollama with Llama 3 and Llama 3.1 (8B) already downloaded. Commerce's own stack in Docker already takes about 16 GB of that memory. What that allows:

| Piece | On the Mac | Note |
| --- | --- | --- |
| Language model | Ollama with Llama 3.1 8B, already there | Runs on the Mac's graphics through Metal. The gateway talks to Ollama now and to vLLM on AWS later, so nothing in Commerce changes when we move |
| Larger models (gpt-oss 20B and similar) | Only with the Docker stack trimmed | They need about 14–16 GB; with Commerce's containers running, the Mac would swap. The largest models (gpt-oss 120B, about 65 GB) are not possible locally |
| Speech | whisper.cpp or MLX Whisper (MIT) | Use the Mac's graphics; faster-whisper runs on the processor only on a Mac |
| OCR | docTR, Tesseract, Granite-Docling | On the processor or Apple's graphics (PyTorch MPS) |
| Embeddings | A small embedding model through Ollama (for example nomic-embed-text, Apache 2.0) | |
| Vector database | Qdrant in Docker | A few hundred MB |
| Experiments and labelling | MLflow and Label Studio in Docker | Started only when needed |
| PyTorch, TensorFlow | PyTorch on Apple's graphics (MPS); TensorFlow on the processor | Fine for running models and small fine-tunes |

**Not possible on the Mac, kept for AWS:** vLLM, NVIDIA Triton, NeMo and TensorRT (they need NVIDIA graphics cards); fine-tuning models above about 8B parameters (small LoRA fine-tunes with MLX or PyTorch work locally). Containers on a Mac cannot use its graphics, so Ollama and the model readers run directly on the Mac and the containers reach them over the host address.

**Set up 12 October:** a Python 3.12 environment for `commerce-ai` (managed by uv; the Mac's own Python is 3.14), the Python packages above, Tesseract and whisper.cpp, Qdrant in Docker, and the nomic-embed-text model in Ollama, all checked end to end. TensorFlow runs on the processor only: its Mac graphics plugin needs an older TensorFlow and NumPy than the rest of the stack.

**Your phone:** the web app reaches the Mac over the same Wi-Fi by its network address, as the meeting media already does. Away from home that would need a private tunnel such as Tailscale; for now the phone is used at home only.

## 10. Training and improvement

- **Base fine-tuning** on public and synthetic data and our own labelled set: Nigerian receipts, invoices, waybills, handwriting and voice in the five starting languages.
- **Learning from corrections** stays per organisation ("Golden Foods writes 'Peak 400g tin' for PEAK-MLK-400"): it improves that organisation's results only.
- **Organisations' data is never used to train the shared models unless the organisation opts in** (default: off). An organisation that opts in can withdraw, and its data leaves the next training set.
- **Evaluation before release:** every new model version must beat the current one on the test set before it serves anyone.

## 11. Privacy, security and limits

- **Tenancy:** organisation id on every row, every index entry, every job; isolation tested as Commerce's tenancy sweep tests the API.
- **Retention:** the organisation sets how long originals, transcripts, chat history and index entries are kept, per location or however it chooses.
- **Personal data:** IDs and bank letters stay sensitive; consent to record is reminded; Nigeria's data protection law (NDPA) and each country's rules apply to where data is stored.
- **Usage limits:** Commerce meters pages, minutes and messages per organisation; the organisation decides whether to set its own monthly limits and who is told as they near them.
- **Messaging channels:** each platform's business terms apply (for example WhatsApp's rules on which messages a business may send first); the organisation connects its own accounts.

## 11.1 AI across the modules: what is best and works

The list of ERP AI features you shared (finance, inventory, sales, HR, procurement, support, operations), weighed against what Commerce already has, the data our organisations will hold, and the risk of each.

### Principles

1. **Build on what exists.** Commerce already has receipt matching that proposes matches, a cash-flow view from obligations, reorder points, supplier risk scores, asset predictions and anomalies, KPI forecasts and report definitions. AI makes these better; it does not start again beside them.
2. **The right tool for each job.** Language models for language: reading documents, drafting, classifying text, answering questions. Classic machine learning for numbers: forecasts, scores and anomalies, where it is cheaper, faster, explainable and usually more accurate than a language model.
3. **Cold start is the norm.** A new organisation has little history. Every forecast and score starts from simple statistics and rules that work from the first month, and switches to a learned model only when there is enough history, showing which one is in use.
4. **Suggest, explain, let people decide.** Every score and forecast shows why (the figures behind it), lands as a suggestion or a draft, and learns from what people accept or reject.
5. **Prove it before showing it.** A new model runs silently first ("shadow mode") and is shown only when its back-test beats the simple method on that organisation's own history.
6. **No raw SQL from a model.** Questions in plain language go through the reporting layer and the person's permissions (section 5), never through text-to-SQL on the database, which would bypass permissions and tenancy.
7. **Our own service.** The listed cloud tools (Azure Form Recognizer, OpenAI, LangChain, Rasa) are replaced by Commerce AI's own models and tools (sections 8 and 9).

### Feature by feature

| Area | Feature | Verdict | How |
| --- | --- | --- | --- |
| Finance | Invoice capture, coding and matching | **Build first** | Capture (section 4) reads the bill; the supplier, account and tax code are suggested from that supplier's history; duplicate bills are flagged (same supplier, amount and date, or same number); receipt matching learns from the matches people accept |
| Finance | Cash flow forecast | **Build, on what exists** | Keep today's obligations-based view (known bills, invoices, payroll); add a statistical forecast of what is not yet on paper (typical collections, recurring spend) once there are about six months of history |
| Finance | When customers will pay | **Add** (not in your list) | Predicts each open invoice's likely payment date from the customer's history; orders the collections list and feeds the cash forecast |
| Inventory | Demand forecasting | **Build** | Per item and location: simple seasonal statistics first, then one gradient-boosted model across items once history allows; forecasts shown with a range, not one number |
| Inventory | Reorder automation | **Build, on what exists** | Suggests reorder points and quantities from the forecast, supplier lead times (Phase 12 performance) and service level; drafts purchase requisitions or transfers for a person to approve; never orders by itself unless the organisation's automation rules say so |
| Sales and CRM | Deal win likelihood | **Build later** | Learned from the organisation's own won and lost deals by stage, value and activity; useful only after a few hundred closed deals, so it starts as stage-based percentages |
| Sales and CRM | Email and proposal drafting | **Build first** | Drafts follow-ups, quotation cover notes and reminders from the record's context, in the organisation's tone and the customer's language; always sent by a person |
| HR | CV parsing | **Build** | Reads CVs into candidate fields (capture) and shows how each matches the job's stated requirements, with the evidence |
| HR | Ranking candidates, predicting who will leave | **Hold back** | High legal and fairness risk: hiring AI is "high risk" under the EU AI Act, needs bias audits in places such as New York City, and automated decisions about people are restricted under Nigeria's data protection law. If built later: never ranking or deciding on its own, team-level signals rather than predictions about named people, bias-tested, off by default |
| Procurement | Supplier risk | **Build, on what exists** | Adds learned signals to the risk score already built: late-delivery likelihood for each open order, price rises against history, quality trends |
| Procurement | Order optimisation | **Build** | Suggests supplier and quantity per requisition from price, lead time, minimums, scorecards and the demand forecast, with the trade-off shown |
| Support | Ticket triage and sentiment | **Build first** | Category, priority, language and tone on arrival; angry or urgent tickets escalated; cheap and reliable with a small model |
| Support | Assistant for customers | **Build** | On the shop and messaging channels: answers from the organisation's own knowledge (section 7), tracks orders, hands over to a person with the conversation |
| Support | Suggested replies for staff | **Add** | Drafts a reply from past answers and policies; the agent edits and sends |
| Operations | Questions in plain language | **Build** | As section 5: through report definitions and permissions, not text-to-SQL |
| Operations | Anomaly detection | **Build, on what exists** | Extends today's asset and KPI anomalies to transactions: unusual amounts, duplicate payments, price overrides, postings at odd hours, unusual sign-ins; each with its reason, sent to the right person or approval |
| Catalogue | Product descriptions and translations | **Add** | For the online shop: descriptions, tags and translations drafted from the item's data and photos |

### Tools for the number features

All open source and permissively licensed: statsforecast and Prophet for forecasts; LightGBM and XGBoost for scores and forecasts across many items; scikit-learn (including Isolation Forest) for anomalies; SHAP to explain each score; GluonTS (DeepAR) only when an organisation's data is large enough to need it.

### Order

- **Wave 1, with the service foundation:** bill and receipt capture with coding and duplicate checks, matching that learns, drafting, ticket triage, questions in plain language.
- **Wave 2, once history builds:** demand forecasts and reorder suggestions, cash and payment-date forecasts, transaction anomalies, order optimisation, supplier delay prediction.
- **Wave 3:** deal likelihood, the customer assistant on shop and messaging channels, actions through MCP, product content.
- **Held back:** candidate ranking and attrition prediction.

## 12. Proposed order

*Status, 14 October 2026: steps 1 and 2 built (13 October); steps 4, 6, 7 and 8 built together as the assistant of section 7.1 (14 October; see `COMMERCE_AI.md` sections 10 to 17); steps 3, 5, 9 and 10 to do.*

1. **The service foundation:** repository, model gateway, model serving, metering, tenancy, the API and events with Commerce, the evaluation harness and the first test set.
2. **Capture: bills and expense receipts** from upload, camera and Drive, with review and originals kept.
3. **Capture: every form** (delivery notes, goods receipts, onboarding papers, then all document types) and the Capture inbox with email.
4. **Voice:** recorded and uploaded notes and live dictation, Nigerian English first, then Pidgin, Yoruba, Igbo and Hausa.
5. **Messaging channels:** WhatsApp, Telegram, Instagram and Messenger, TikTok, connected by the organisation, feeding capture and the Communication module.
6. **Knowledge:** indexing, retrieval, permission checks, the chat panel answering from records and documents.
7. **Reports on request:** chat to report and dashboard widget.
8. **Act:** MCP tools completed for every module; drafts, plans, confirmations and audit.
9. **Training loop:** fine-tuning, per-organisation learning, opt-in data, release gates.
10. **Phone app** capture and voice on the move, offline queueing.

## 13. Your answers (12 October)

1. **Bring your own provider:** yes. The existing AI provider slot stays; Commerce AI is the default.
2. **Training on organisations' data:** opt-in per organisation, off by default.
3. **Models:** use what we have, Llama through Ollama, behind the gateway; others (gpt-oss, Mistral, Granite, N-ATLaS, and DeepSeek later) plug in as we develop.
4. **Hosting:** local on the Mac for now (9.1), used from your phone at home; later AWS through infrastructure as code.
5. **Pricing:** included in each plan as part of the package; the pricing strategy is worked out when we reach that phase.
6. **Messaging channels:** whatever works best first; all of them in the end, and more. Proposed: WhatsApp, then Instagram and Messenger (the same Meta platform and approval), then Telegram, then TikTok.
7. **Name:** `commerce-ai`.
8. **AI across the modules:** the waves in 11.1 are agreed, with candidate ranking and attrition prediction held back.
