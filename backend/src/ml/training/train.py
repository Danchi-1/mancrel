"""
ml/training/train.py
====================
Labelled training data and two utility functions:

  train_and_save(save_path)  — fine-tune the SetFit classifier and save it.
                               Run this ONCE on a capable machine, then commit
                               or upload the saved model directory.

  load_classifier(save_path) — load the saved model from disk for inference.
                               This is what pipeline.py calls at startup.

Importing this module is intentionally side-effect free: no model download,
no training, no heavy library loading happens at import time.
"""

import os

# ---------------------------------------------------------------------------
# Labelled training data
# ---------------------------------------------------------------------------

TRAINING_DATA = [
    # polite_greeting
    {"text": "Good morning", "label": "polite_greeting"},
    {"text": "Good afternoon boss", "label": "polite_greeting"},
    {"text": "Good evening", "label": "polite_greeting"},
    {"text": "Happy Sunday", "label": "polite_greeting"},
    {"text": "Hello", "label": "polite_greeting"},
    {"text": "Hi there", "label": "polite_greeting"},
    {"text": "How far", "label": "polite_greeting"},
    {"text": "How far boss", "label": "polite_greeting"},
    {"text": "Hope you're doing well", "label": "polite_greeting"},
    {"text": "Compliments of the season", "label": "polite_greeting"},

    # irrelevant_or_inappropriate
    {"text": "I love you", "label": "irrelevant_or_inappropriate"},
    {"text": "You're so cute", "label": "irrelevant_or_inappropriate"},
    {"text": "Marry me", "label": "irrelevant_or_inappropriate"},
    {"text": "I miss you", "label": "irrelevant_or_inappropriate"},
    {"text": "Can we be friends?", "label": "irrelevant_or_inappropriate"},
    {"text": "You're my soulmate", "label": "irrelevant_or_inappropriate"},
    {"text": "I can't stop thinking about you", "label": "irrelevant_or_inappropriate"},
    {"text": "Do you have a boyfriend?", "label": "irrelevant_or_inappropriate"},
    {"text": "I want to date you", "label": "irrelevant_or_inappropriate"},
    {"text": "You make me happy", "label": "irrelevant_or_inappropriate"},

    # sales_intent
    {"text": "How much is this?", "label": "sales_intent"},
    {"text": "What is the price?", "label": "sales_intent"},
    {"text": "I want to buy this", "label": "sales_intent"},
    {"text": "Do you have this in stock?", "label": "sales_intent"},
    {"text": "Is this still available?", "label": "sales_intent"},
    {"text": "How can I order?", "label": "sales_intent"},
    {"text": "I'm interested in your product", "label": "sales_intent"},
    {"text": "How much for delivery?", "label": "sales_intent"},
    {"text": "Can I place an order?", "label": "sales_intent"},
    {"text": "What are your prices?", "label": "sales_intent"},

    # support_issue
    {"text": "My app is not working", "label": "support_issue"},
    {"text": "I made a transfer but nothing happened", "label": "support_issue"},
    {"text": "I can't log in", "label": "support_issue"},
    {"text": "The app keeps crashing", "label": "support_issue"},
    {"text": "My payment failed", "label": "support_issue"},
    {"text": "I was debited twice", "label": "support_issue"},
    {"text": "The service is not responding", "label": "support_issue"},
    {"text": "I didn't receive confirmation", "label": "support_issue"},
    {"text": "Something is wrong with my account", "label": "support_issue"},
    {"text": "Please help me fix this issue", "label": "support_issue"},
]

# Default save path sits next to this file so it travels with the repo
DEFAULT_SAVE_PATH = os.path.join(os.path.dirname(__file__), "saved_classifier")
BASE_MODEL_ID = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"


def train_and_save(save_path: str = DEFAULT_SAVE_PATH) -> None:
    """
    Fine-tune the SetFit classifier on TRAINING_DATA and persist it to disk.

    Run once on a machine with sufficient resources:
        python -m ml.training.train --train

    The resulting directory can be committed to the repo or uploaded to
    object storage (e.g. S3, GCS) so that Render can pull it at build time
    instead of training on every deploy.
    """
    # Heavy imports kept local — never triggered just by importing this module
    import pandas as pd
    from datasets import Dataset
    from setfit import SetFitModel, Trainer, TrainingArguments

    print(f"[train] Loading base model: {BASE_MODEL_ID}")
    model = SetFitModel.from_pretrained(BASE_MODEL_ID)

    df = pd.DataFrame(TRAINING_DATA)
    dataset = Dataset.from_pandas(df)

    trainer = Trainer(
        model=model,
        args=TrainingArguments(num_epochs=5, batch_size=16),
        train_dataset=dataset,
    )
    trainer.train()

    os.makedirs(save_path, exist_ok=True)
    model.save_pretrained(save_path)
    print(f"[train] Classifier saved to: {save_path}")


def load_classifier(save_path: str = DEFAULT_SAVE_PATH):
    """
    Load the pre-trained SetFit classifier from disk.

    Raises FileNotFoundError if train_and_save() has not been run yet.
    This is what pipeline.py calls — fast, CPU-safe, no training.
    """
    from setfit import SetFitModel

    if not os.path.isdir(save_path):
        raise FileNotFoundError(
            f"No saved classifier found at '{save_path}'. "
            "Run `python -m ml.training.train --train` first to train and save the model."
        )
    print(f"[classifier] Loading from: {save_path}")
    return SetFitModel.from_pretrained(save_path)


# ---------------------------------------------------------------------------
# CLI entrypoint: python -m ml.training.train --train
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Train and save the Mancrel message classifier."
    )
    parser.add_argument(
        "--train",
        action="store_true",
        help="Run training and save the model to disk.",
    )
    args = parser.parse_args()

    if args.train:
        train_and_save()
    else:
        print("Pass --train to start training. Example:")
        print("  python -m ml.training.train --train")