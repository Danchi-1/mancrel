"""
vector_db.py
============
Our new AI Semantic Search engine.

This module initializes ChromaDB (an embedded local Vector DB) and wires it up
to use our custom, 8-bit quantized ONNX model to generate math embeddings from text.
"""

import os
import chromadb
import torch
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer

# 1. We create a custom Embedding Function that tells ChromaDB how to translate text into numbers.
class QuantizedONNXEmbeddingFunction(EmbeddingFunction):
    def __init__(self):
        # We point it to the tiny compressed INT8 model we generated
        model_dir = os.path.join(os.path.dirname(__file__), "../../../ml/models/all-MiniLM-L6-v2-int8")
        if not os.path.exists(model_dir):
            raise RuntimeError(f"Quantized model not found at {model_dir}. Run compress_model.py first!")
            
        print(f"Loading Quantized INT8 AI Model into RAM from {model_dir}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = ORTModelForFeatureExtraction.from_pretrained(model_dir)
        
    def __call__(self, texts: Documents) -> Embeddings:
        """
        This is the core magic:
        1. Tokenize: Break sentences into tiny word chunks.
        2. Neural Net: Push chunks through the 8-bit ONNX AI model.
        3. Mean Pooling: Average the meaning of all chunks into one single 384-length math vector.
        """
        # Step 1: Tokenize
        inputs = self.tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
        
        # Step 2: Push through the AI model
        outputs = self.model(**inputs)
        
        # Step 3: Average the output (Mean Pooling)
        token_embeddings = outputs[0]
        attention_mask = inputs['attention_mask']
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        
        # Step 4: Normalize so we can compare vectors easily using Cosine Similarity
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        
        return embeddings.tolist()

# 2. Initialize ChromaDB
db_path = os.path.join(os.path.dirname(__file__), "../../../chroma_data")
client = chromadb.PersistentClient(path=db_path)

# Initialize our custom embedder
embedding_fn = QuantizedONNXEmbeddingFunction()

# 3. Create or get our two core collections
# Collections in ChromaDB are just like tables in SQL
inbox_collection = client.get_or_create_collection(
    name="inbox_messages",
    embedding_function=embedding_fn
)

catalogue_collection = client.get_or_create_collection(
    name="catalogue_items",
    embedding_function=embedding_fn
)

print("✅ Semantic Vector Database Initialized Successfully!")
