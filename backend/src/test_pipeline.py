"""
test_pipeline.py
----------------
Local smoke test for the Mancrel messaging pipeline.

Run from backend/src/:
    python test_pipeline.py

What this tests:
  Step 1 — generate_reply() via OpenRouter (no classifier needed, tests API key)
  Step 2 — classify() via the saved SetFit model (requires training first)

If Step 2 fails with FileNotFoundError, run the training first:
    python -m ml.training.train --train
"""

import os
import sys

# Load .env from backend/ (parent of src/)
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)
    print(f"[env] Loaded: {env_path}\n")
else:
    print(f"[env] WARNING: No .env found at {env_path}")
    print("[env] Copy backend/.env.example to backend/.env and fill in your key.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Test generate_reply (LLM via OpenRouter)
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 60)
print("STEP 1: Testing generate_reply() via OpenRouter")
print("=" * 60)

from api.v1.messaging.pipeline import generate_reply

sample_catalogue = [
    {"name": "Prepaid Meter Token (1000 units)", "price": "₦500",  "available": True,  "description": "Instant electricity top-up"},
    {"name": "Enterprise Software License",       "price": "₦45,000/month", "available": True,  "description": "Unlimited API access"},
    {"name": "Hardware Bundle",                   "price": "₦12,000", "available": False, "description": "Router + SIM combo"},
]

test_cases = [
    {
        "message":        "Good morning, I hope you're doing well",
        "classification": "polite_greeting",
        "catalogue":      None,   # greetings don't need catalogue
    },
    {
        "message":        "How much is the prepaid meter token?",
        "classification": "sales_intent",
        "catalogue":      sample_catalogue,
    },
    {
        "message":        "I made a payment but I didn't get my token",
        "classification": "support_issue",
        "catalogue":      sample_catalogue,
    },
    {
        "message":        "Do you sell laptops?",  # item NOT in catalogue
        "classification": "sales_intent",
        "catalogue":      sample_catalogue,
    },
]

for i, case in enumerate(test_cases, start=1):
    print(f"\n--- Test {i} ---")
    print(f"Message : {case['message']}")
    print(f"Label   : {case['classification']}")
    try:
        result = generate_reply(
            message=case["message"],
            classification=case["classification"],
            catalogue_items=case["catalogue"],
        )
        print(f"Model   : {result['model_used']}")
        print(f"Conf.   : {result['confidence']}")
        print(f"Reply   : {result['reply']}")
    except EnvironmentError as e:
        print(f"[ERROR] {e}")
        print("Set OPENROUTER_API_KEY in backend/.env and retry.")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected: {e}")
        raise


# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Test classify() — requires saved_classifier/ to exist
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("STEP 2: Testing classify() — SetFit classifier")
print("=" * 60)

from api.v1.messaging.pipeline import classify

classify_cases = [
    "Good morning",
    "How much is the enterprise plan?",
    "My payment failed and I need help",
    "I love you",
    "Can I place an order for 5 units?",
]

try:
    for text in classify_cases:
        label = classify(text)
        print(f"  '{text}'")
        print(f"   → {label}\n")
except ImportError:
    print("\n[SKIP] setfit / sentence-transformers not installed yet.")
    print("Install the full ML stack when you're ready:")
    print("  pip install -r backend/requirements.txt --resume-retries 3")
except FileNotFoundError as e:
    print(f"\n[SKIP] Classifier not trained yet: {e}")
    print("\nRun training first:")
    print("  cd backend/src && python -m ml.training.train --train")
    print("\nThen re-run this test script.")

print("\nDone.")
