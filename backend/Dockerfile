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
