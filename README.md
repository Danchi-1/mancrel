# Mancrel
A customer relations management systems for products seller. Helps keep track of things you're selling and the customers you're selling to without ignoring anyone.

MANCREL: PROJECT SUMMARY (Finalized & Ordered)
1. Core Goal
    - Build Mancrel, an AI-driven all-in-one CRM that:
    - Manages contacts, companies, deals, activities
    - Uses AI to classify incoming messages
    - Generates or auto-sends email replies
    - Continuously syncs an external product catalogue
    - Runs reliably with workers, queues, and real-time event handling
    - Deploys fully within ~11 days

2. Core Techniques & Architecture You’re Using
    (A) Backend Approach
        - _This is for Mr. Yusuff to decide._
        - Everything containerized with Docker

    (B) Real-Time Event Handling: Webhooks
    - I'm planning on using webhooks to solve the catalogue-update problem.
        My thought up workflow:
        - External system sends POST → /webhook/catalog
        - Validate signature
        - Store event (idempotent)
        - Queue job in Redis
        - Celery processes update
        - Catalogue DB stays always fresh
        - No polling nonsense. Real-time, reliable, scalable.

    (C) AI Layer
    - Used for:
        - Email/Message Classification
        - Intent detection
        - Priority scoring
        - Confidence thresholds
    - AI Auto-Reply System
        - AI generates draft responses
        - Auto-send only if confidence high
        - Human-in-the-loop fallback
        - Every suggestion logged for auditing
    - Catalogue-assisted responses
        - AI pulls product details from the synced catalogue
        - Helps answer customer queries faster
    - Decision thresholds:
        - >= 0.90 → auto-send
        - 0.60 – 0.89 → requires human approval
        - < 0.60 → no auto-reply, escalate to human

    (D) Background Workers
    - You’re using Celery workers + Redis for:
        - Webhook event processing
        - AI inference jobs
        - Email sending
        - Catalogue sync
        - Scheduled fallback pollers
        - Anything heavy or long-running
        - The API never blocks. Everything async.

    (E) Catalogue Sync Strategy
    - Two-layer strategy:
        - Primary: Webhooks (instant updates)
        - Fallback: Timed polling (in case webhooks fail)
        - Catalogue always stays in sync.

3. Key Features Being Built
    - Contact management
    - Company management
    - Deal pipeline (Kanban style)
    - Activities (emails, calls, tasks)
    - Email ingestion (webhook or IMAP)
    - AI classifier
    - AI auto-reply system
    - Catalogue sync system
    - RBAC (Admin, Manager, Rep)
    - Background worker pipeline
    - Minimal analytics
    - Fully deployed frontend + backend
        - _This is the MVP that actually matters._

4. 11-Day Timeline (Locked & Final)
- Day 0: Setup
    - Repo
    - Docker + docker-compose (FastAPI, Postgres, Redis, Celery)
    - Basic CI pipeline
- Day 1: Auth + DB Schema
    - Users, Roles, Deals, Activities, Catalogue
    - JWT auth + RBAC
- Day 2: Core Backend APIs
    - CRUD for contacts, companies
    - Deals + pipeline movement
    - Activities
- Day 3: Frontend Skeleton
    - Login
    - Contacts page
    - Deals Kanban
    - Activity feed
- Day 4: Worker Infrastructure
    - Celery + Redis hooked
    - Test jobs running
- Day 5: Email Ingestion + Classifier
    - Endpoint for email events
    - Classifier pipeline
    - Logs stored
- Day 6: AI Auto-Reply
    - LLM integration
    - Confidence thresholds
    - Approval workflow
    - Auto-send for safe emails
- Day 7: Catalogue Sync
    - Webhook receiver
    - Signature validation
    - Upsert logic (idempotent)
    - Fallback poller
- Day 8: Reliability Layer
    - Retries
    - Dead-letter queue
    - Monitoring + logging
- Day 9: UI Polishing
    - AI suggestion UI
    - Activity timeline
    - Catalogue UI section
- Day 10: Testing
    - Integration tests
    - Load smoke testing
    - Fix bottlenecks
- Day 11: Deployment
    - Full VPS deployment
    - Domain mapping
    - Production smoke tests
    - Final presentation prep

5. Project Identity Finalized
Name: Mancrel
Meaning:
MAN → Management
CREL → Customer Relations Layer
    _Why? Short. Practical. Brandable._

#### Mr. Ahmad Yusuff is allowed to make changes to any of the backend strategy or this README.md as he sees fit.

### WHAT THE PROJECT DOES

MANCREL is an AI-powered, all-in-one CRM built to automate customer relationship management far beyond what traditional CRMs do.

It manages contacts, companies, leads, messages, notes, interactions, preferences then it layers AI on top to turn the CRM from a dumb storage tool into an intelligent assistant.

At its core, it:
1. Collects, stores, and organizes customer & company data
- A central backend (Postgres + Redis + Vector DB) manages all CRM records: users, customers, messages, catalog data, logs, preferences, etc.

2. Handles communication channels
- It receives emails, messages (Meta APIs, WhatsApp, Messenger), customer inquiries, support requests
- Everything enters the CRM automatically — no manual data entry.

3. Uses AI to classify, understand, and act on messages. Incoming messages are processed using:
- text classification
- intent detection
- semantic search
- auto-reply generation
- personalization ranking

Then the system decides whether to:
- reply instantly
- escalate
- assign a task
- log an interaction
- route it to the right department

4. Continuously updates and enriches product/catalog data

Catalog info lives on another site. Mancrel fetches, monitors, and embeddings-syncs it to:
- recommend products
- match customers to offerings
- answer catalog-specific questions
- keep personalization accurate

5. Provides smart insights & dashboards

AI highlights:
- customer behavior patterns
- important leads
- past interactions
- preferences
- recommended products
- churn alerts
- opportunities
You’re building an intelligent relationship engine, not a boring CRUD dashboard.

WHAT WE AIM TO ACHIEVE
1. Build a CRM that’s genuinely intelligent: not just a database
Most CRMs are glorified spreadsheets but Mancrel makes decisions, understands text, and automates tasks.

2. Reduce human workload drastically

The AI handles:
- replies
- classification
- customer prioritization
- product matching
- message routing
- personalization
- recommendations
Users only handle what the AI can’t.

3. Achieve deep personalization
Every interaction the company has with a customer influences what the system recommends next.

4. Leverage Vector-Powered Search (VPS) for semantic understanding

Instead of keyword search:
- conversations
- catalog data
- notes
- customer profiles

are converted into embeddings stored in a Vector DB.
This enables true semantic matching, not “CTRL+F with sugar.”

5. Integrate Meta APIs for smart, automated messaging
### Since this is a Meta hackathon, MANCREL must shine here:
- automated replies on Messenger/WhatsApp
- real-time classification of inquiries
- lead retrieval
- CRM enrichment from Meta channels

6. Make a complete MVP in ~11 days
- a minimal but functional CRM core, an AI engine that handles the high-impact tasks, a clean frontend that interacts with the backend, a vector-powered personalization layer while keeping the architecture modular and scalable.

THE FINAL OUTCOME
- A functioning, deployed CRM system that:
- stores customer and company data
- receives and organizes communications
- analyzes messages with AI
- auto-replies where possible
- syncs catalog data
- recommends responses and products
- learns customer behavior
- supports Meta-based integrations
- runs fast (Redis), accurate (Postgres), and smart (Vector DB)