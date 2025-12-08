# mancrel
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
        _This is for Mr. Yusuff to decide._
    - Everything containerized with Docker

    (B) Real-Time Event Handling: Webhooks
    - I'm planning on using webhooks to solve the catalogue-update problem.
        My thought up workflow:
        - External system sends POST → /webhook/catalog
        - Validate signature
        - Store event (idempotent)
        - Queue job in Redis
        Celery processes update
        - Catalogue DB stays always fresh
        - No polling nonsense. Real-time, reliable, scalable.

    (C) AI Layer
        -> Used for:
        - Email/Message Classification
        - Intent detection
        - Priority scoring
        - Confidence thresholds
        -> AI Auto-Reply System
        - AI generates draft responses
        - Auto-send only if confidence high
        - Human-in-the-loop fallback
        - Every suggestion logged for auditing
        -> Catalogue-assisted responses
        - AI pulls product details from the synced catalogue
        - Helps answer customer queries faster
        -> Decision thresholds:
        - >= 0.90 → auto-send
        - 0.60 – 0.89 → requires human approval
        - < 0.60 → no auto-reply, escalate to human

    (D) Background Workers
    -> You’re using Celery workers + Redis for:
    - Webhook event processing
    - AI inference jobs
    - Email sending
    - Catalogue sync
    - Scheduled fallback pollers
    - Anything heavy or long-running
    - The API never blocks. Everything async.

    (E) Catalogue Sync Strategy
    -> Two-layer strategy:
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
    _This is the MVP that actually matters._

4. 11-Day Timeline (Locked & Final)
    Day 0: Setup
    - Repo
    - Docker + docker-compose (FastAPI, Postgres, Redis, Celery)
    - Basic CI pipeline
    Day 1: Auth + DB Schema
    - Users, Roles, Deals, Activities, Catalogue
    - JWT auth + RBAC
    Day 2: Core Backend APIs
    - CRUD for contacts, companies
    - Deals + pipeline movement
    - Activities
    Day 3: Frontend Skeleton
    - Login
    - Contacts page
    - Deals Kanban
    - Activity feed
    Day 4: Worker Infrastructure
    - Celery + Redis hooked
    - Test jobs running
    Day 5: Email Ingestion + Classifier
    - Endpoint for email events
    - Classifier pipeline
    - Logs stored
    Day 6: AI Auto-Reply
    - LLM integration
    - Confidence thresholds
    - Approval workflow
    - Auto-send for safe emails
    Day 7: Catalogue Sync
    - Webhook receiver
    - Signature validation
    - Upsert logic (idempotent)
    - Fallback poller
    Day 8: Reliability Layer
    - Retries
    - Dead-letter queue
    - Monitoring + logging
    Day 9: UI Polishing
    - AI suggestion UI
    - Activity timeline
    - Catalogue UI section
    Day 10: Testing
    - Integration tests
    - Load smoke testing
    - Fix bottlenecks
    Day 11: Deployment
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

### Mr. Ahmad Yusuff is allowed to make changes to any of the backend strategy or this README.md as he sees fit.
