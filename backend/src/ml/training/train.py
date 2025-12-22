data = [
    # polite_greeting
    {"text": "Good morning", "label": "polite_greeting"},
    {"text": "Good afternoon boss", "label": "polite_greeting"},
    {"text": "Good evening", "label": "polite_greeting"},
    {"text": "Happy Sunday", "label": "polite_greeting"},
    {"text": "Hello", "label": "polite_greeting"},
    {"text": "Hi there", "label": "polite_greeting"},
    {"text": "How far", "label": "polite_greeting"},
    {"text": "How far boss", "label": "polite_greeting"},
    {"text": "Hope you’re doing well", "label": "polite_greeting"},
    {"text": "Compliments of the season", "label": "polite_greeting"},

    # irrelevant_or_inappropriate
    {"text": "I love you", "label": "irrelevant_or_inappropriate"},
    {"text": "You’re so cute", "label": "irrelevant_or_inappropriate"},
    {"text": "Marry me", "label": "irrelevant_or_inappropriate"},
    {"text": "I miss you", "label": "irrelevant_or_inappropriate"},
    {"text": "Can we be friends?", "label": "irrelevant_or_inappropriate"},
    {"text": "You’re my soulmate", "label": "irrelevant_or_inappropriate"},
    {"text": "I can’t stop thinking about you", "label": "irrelevant_or_inappropriate"},
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
    {"text": "I’m interested in your product", "label": "sales_intent"},
    {"text": "How much for delivery?", "label": "sales_intent"},
    {"text": "Can I place an order?", "label": "sales_intent"},
    {"text": "What are your prices?", "label": "sales_intent"},

    # support_issue
    {"text": "My app is not working", "label": "support_issue"},
    {"text": "I made a transfer but nothing happened", "label": "support_issue"},
    {"text": "I can’t log in", "label": "support_issue"},
    {"text": "The app keeps crashing", "label": "support_issue"},
    {"text": "My payment failed", "label": "support_issue"},
    {"text": "I was debited twice", "label": "support_issue"},
    {"text": "The service is not responding", "label": "support_issue"},
    {"text": "I didn’t receive confirmation", "label": "support_issue"},
    {"text": "Something is wrong with my account", "label": "support_issue"},
    {"text": "Please help me fix this issue", "label": "support_issue"},
]

from setfit import SetFitModel, Trainer
from sentence_transformers.losses import CosineSimilarityLoss
from datasets import Dataset
import pandas as pd

model_id = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
class_model = SetFitModel.from_pretrained(model_id)

df = pd.DataFrame(data, columns=['label', 'text'])
dataset = Dataset.from_pandas(df)
class_model.fit(texts, labels, num_epochs=5)