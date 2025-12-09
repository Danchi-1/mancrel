# Mancrel

A customer relations management system for product sellers. Helps track your products and customers without ignoring anyone.

## MANCREL: PROJECT SUMMARY (Finalized & Ordered)

### 1. Core Goal

Build Mancrel, an AI-driven all-in-one CRM that:
- Manages contacts, companies, deals, and activities
- Uses AI to classify incoming messages
- Generates or auto-sends email replies
- Continuously syncs an external product catalogue
- Runs reliably with workers, queues, and real-time event handling
- Deploys fully within ~11 days

### 2. Core Techniques & Architecture

#### (A) Backend Approach
- Everything containerized with Docker
- *This is for Mr. Yusuff to decide.*

#### (B) Real-Time Event Handling: Webhooks
- Using webhooks to solve the catalogue-update problem
- Workflow:
  1. External system sends POST → /webhook/catalog
  2. Validate signature
  3. Store event (idempotent)
  4. Queue job in Redis
  5. Celery processes update
  6. Catalogue DB stays always fresh
  7. No polling nonsense. Real-time, reliable, scalable.

#### (C) AI Layer
- Used for:
  - Email/Message Classification
  - Intent detection
  - Priority scoring
  - Confidence thresholds

- AI Auto-Reply System:
  - AI generates draft responses
  - Auto-send only if confidence high (≥ 0.90)
  - Human-in-the-loop fallback (0.60–0.89)
  - No auto-reply for < 0.60 (escalate)
  - Every suggestion logged for auditing
  - Catalogue-assisted responses

#### (D) Background Workers
- Celery workers + Redis for:
  - Webhook event processing
  - AI inference jobs
  - Email sending
  - Catalogue sync
  - Scheduled fallback pollers
  - Anything heavy or long-running
  - The API never blocks. Everything async.

#### (E) Catalogue Sync Strategy
- Two-layer strategy:
  - Primary: Webhooks (instant updates)
  - Fallback: Timed polling (in case webhooks fail)
  - Catalogue always stays in sync

### 3. Key Features Being Built
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
  - *This is the MVP that actually matters.*

### 4. 11-Day Timeline (Locked & Final)

| Day | Task |
|-----|------|
| 0 | Setup: Repo, Docker + docker-compose (FastAPI, Postgres, Redis, Celery), Basic CI pipeline |
| 1 | Auth + DB Schema: Users, Roles, Deals, Activities, Catalogue, JWT auth + RBAC |
| 2 | Core Backend APIs: CRUD for contacts, companies, Deals + pipeline movement, Activities |
| 3 | Frontend Skeleton: Login, Contacts page, Deals Kanban, Activity feed |
| 4 | Worker Infrastructure: Celery + Redis hooked, Test jobs running |
| 5 | Email Ingestion + Classifier: Endpoint for email events, Classifier pipeline, Logs stored |
| 6 | AI Auto-Reply: LLM integration, Confidence thresholds, Approval workflow, Auto-send for safe emails |
| 7 | Catalogue Sync: Webhook receiver, Signature validation, Upsert logic (idempotent), Fallback poller |
| 8 | Reliability Layer: Retries, Dead-letter queue, Monitoring + logging |
| 9 | UI Polishing: AI suggestion UI, Activity timeline, Catalogue UI section |
| 10 | Testing: Integration tests, Load smoke testing, Fix bottlenecks |
| 11 | Deployment: Full VPS deployment, Domain mapping, Production smoke tests, Final presentation prep |

### 5. Project Identity Finalized
- **Name**: Mancrel
- **Meaning**:
  - MAN → Management
  - CREL → Customer Relations Layer
  - *Why? Short. Practical. Brandable.*

*Mr. Ahmad Yusuff is allowed to make changes to any of the backend strategy or this README.md as he sees fit.*

## WHAT THE PROJECT DOES

MANCREL is an AI-powered, all-in-one CRM built to automate customer relationship management far beyond what traditional CRMs do.

### Core Features:
1. **Data Management**:
   - Central backend (Postgres + Redis + Vector DB) manages all CRM records: users, customers, messages, catalog data, logs, preferences

2. **Communication Handling**:
   - Receives emails, messages (Meta APIs, WhatsApp, Messenger), customer inquiries, support requests
   - Everything enters the CRM automatically — no manual data entry

3. **AI Processing**:
   - Classifies, understands, and acts on messages using:
     - Text classification
     - Intent detection
     - Semantic search
     - Auto-reply generation
     - Personalization ranking
   - Decides whether to:
     - Reply instantly
     - Escalate
     - Assign a task
     - Log an interaction
     - Route to the right department

4. **Catalogue Management**:
   - Fetches, monitors, and syncs catalog data to:
     - Recommend products
     - Match customers to offerings
     - Answer catalog-specific questions
     - Keep personalization accurate

5. **Smart Insights**:
   - Provides dashboards with:
     - Customer behavior patterns
     - Important leads
     - Past interactions
     - Preferences
     - Recommended products
     - Churn alerts
     - Opportunities

### What We Aim to Achieve

1. **Intelligent CRM**: Not just a database, but a decision-making, understanding, and automating tool
2. **Workload Reduction**: AI handles replies, classification, prioritization, matching, routing, personalization, recommendations
3. **Deep Personalization**: Every interaction influences future recommendations
4. **Vector-Powered Search**: Semantic understanding instead of keyword search
5. **Meta Integration**: Shine with Meta-based integrations (automated replies, real-time classification, lead retrieval, CRM enrichment)
6. **Complete MVP**: Functional CRM core, AI engine, clean frontend, vector-powered personalization in ~11 days

## THE FINAL OUTCOME

A functioning, deployed CRM system that:
- Stores customer and company data
- Receives and organizes communications
- Analyzes messages with AI
- Auto-replies where possible
- Syncs catalog data
- Recommends responses and products
- Learns customer behavior
- Supports Meta-based integrations
- Runs fast (Redis), accurate (Postgres), and smart (Vector DB)

## File Structure

```
mancrel/
│
├── backend/                           # All server logic, APIs, ML inference, workers
│   ├── src/
│   │   ├── api/                       # REST endpoints (modularized by domain)
│   │   │   ├── v1/
│   │   │   │   ├── auth/              # User authentication routes
│   │   │   │   │   ├── routes.py      # Login, register, logout, token refresh
│   │   │   │   │   └── controllers.py # Logic behind each auth endpoint
│   │   │   │   ├── users/             # User CRUD + permissions
│   │   │   │   ├── crm/               # Contacts, companies, leads, opportunities
│   │   │   │   ├── analytics/         # KPIs, dashboards, activity stats
│   │   │   │   ├── personalization/   # ML-powered suggestions & preferences APIs
│   │   │   │   └── messaging/         # Emails, notifications, templates APIs
│   │   │   └── __init__.py
│   │
│   │   ├── core/                      # Core utilities, app config & shared tools
│   │   │   ├── config.py              # Env vars, settings, service configs
│   │   │   ├── security.py            # JWT, hashing, access control
│   │   │   └── utils.py               # Helper functions used across the app
│   │
│   │   ├── services/                  # External/internal service integrations
│   │   │   ├── postgres_service.py    # Database ORM wrapper, queries
│   │   │   ├── redis_cache.py         # Caching & session layer
│   │   │   ├── vector_db.py           # Vector DB (Pinecone/Qdrant/Milvus) interface
│   │   │   ├── email_service.py       # SMTP or transactional email service
│   │   │   └── sms_service.py         # SMS/WhatsApp integrations (Meta APIs included)
│   │
│   │   ├── workers/                   # Background processing system
│   │   │   ├── task_queue.py          # Queue config (Celery/RQ)
│   │   │   └── background_jobs.py     # Tasks for async processing (embedding, CRM events)
│   │
│   │   ├── models/                    # DB schema & ORM models
│   │   │   ├── user.py                # User table
│   │   │   ├── customer.py            # Customers/contacts table
│   │   │   ├── crm_logs.py            # Interaction logs, call notes, activities
│   │   │   ├── preferences.py         # ML-based preference storage
│   │   │   └── __init__.py
│   │
│   │   ├── db/
│   │   │   ├── migrations/            # Auto-generated DB migrations
│   │   │   ├── seeds/                 # Sample data for development
│   │   │   ├── postgres.py            # DB connection/initialization
│   │   │   └── redis.py               # Cache connection/initialization
│   │
│   │   ├── ml/                        # Machine learning logic
│   │   │   ├── embeddings/            # Text embeddings processing
│   │   │   │   ├── embedder.py        # Generates embeddings for users & CRM text
│   │   │   │   └── preprocess.py      # Cleans text before embedding
│   │   │   ├── training/              # Model training code
│   │   │   │   ├── train.py           # Full training pipeline
│   │   │   │   └── datasets/          # Dataset storage
│   │   │   ├── inference/             # Runtime ML usage
│   │   │   │   ├── recommend.py       # Recommendation engine
│   │   │   │   └── classify.py        # Classification models (intent, sentiment)
│   │   │   └── vector_index/
│   │   │       ├── build_index.py     # Build initial vector database index
│   │   │       └── update_index.py    # Update vectors after new CRM changes
│   │
│   │   ├── app.py                     # App factory (FastAPI/Flask/Express setup)
│   │   └── main.py                    # App entry point
│   │
│   ├── tests/                         # Automated tests
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend Docker image
│   └── README.md
│
├── frontend/                          # Web user interface
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   ├── pages/                     # Core pages (dashboard, contacts, AI insights)
│   │   ├── layouts/                   # App layouts
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── utils/                     # Frontend helper utilities
│   │   ├── services/                  # Axios/fetch API services + WebSockets
│   │   └── styles/                    # Global & module CSS
│   ├── package.json
│   └── README.md
│
├── ml_notebooks/                      # Jupyter notebooks for research
│   ├── experiments/                   # Testing models
│   ├── vector_tests/                  # Pinecone vs Qdrant vs RedisVector
│   ├── model_evaluation/              # Validation results
│   └── data_exploration.ipynb         # Initial data insights
│
├── infrastructure/
│   ├── docker-compose.yml             # To run whole system locally
│   ├── nginx/
│   │   └── nginx.conf                 # Reverse proxy for backend & frontend
│   ├── scripts/
│   │   ├── deploy.sh                  # CI/CD deploy script
│   │   └── setup_server.sh            # Server initialization script
│   ├── monitoring/
│   │   ├── grafana/                   # Dashboard configs
│   │   └── prometheus/                # Metrics config
│   └── README.md
│
└── README.md                          # Root documentation for MANCREL
```