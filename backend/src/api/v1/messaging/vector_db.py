"""
vector_db.py
============
Our new AI Semantic Search engine.

This module initializes ChromaDB (an embedded local Vector DB) and wires it up
to use our custom, 8-bit quantized ONNX model to generate math embeddings from text.
"""

import os
import chromadb
import numpy as np
import onnxruntime as ort
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from tokenizers import Tokenizer

# 1. We create a custom Embedding Function that tells ChromaDB how to translate text into numbers.
class QuantizedONNXEmbeddingFunction(EmbeddingFunction):
    def __init__(self):
        # We point it to the tiny compressed INT8 model we generated
        model_dir = os.path.join(os.path.dirname(__file__), "../../../ml/all-MiniLM-L6-v2-int8")
        if not os.path.exists(model_dir):
            raise RuntimeError(f"Quantized model not found at {model_dir}. Run compress_model.py first!")
            
        print(f"Loading Quantized INT8 AI Model into RAM (Lightweight Mode) from {model_dir}...")
        
        tokenizer_path = os.path.join(model_dir, "tokenizer.json")
        model_path = os.path.join(model_dir, "model_quantized.onnx")
        
        # Load raw Rust tokenizer (zero PyTorch dependency)
        self.tokenizer = Tokenizer.from_file(tokenizer_path)
        self.tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")
        self.tokenizer.enable_truncation(max_length=256)
        
        # Load raw ONNX runtime (zero PyTorch dependency)
        self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        
    def __call__(self, texts: Documents) -> Embeddings:
        """
        This is the core magic:
        1. Tokenize: Break sentences into tiny word chunks.
        2. Neural Net: Push chunks through the 8-bit ONNX AI model.
        3. Mean Pooling: Average the meaning of all chunks into one single 384-length math vector.
        """
        # Step 1: Tokenize
        encoded = self.tokenizer.encode_batch(texts)
        
        input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
        attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
        token_type_ids = np.array([e.type_ids for e in encoded], dtype=np.int64)
        
        # Step 2: Push through the AI model
        outputs = self.session.run(None, {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "token_type_ids": token_type_ids
        })
        
        # Step 3: Average the output (Mean Pooling)
        token_embeddings = outputs[0]
        input_mask_expanded = np.expand_dims(attention_mask, -1).astype(float)
        
        sum_embeddings = np.sum(token_embeddings * input_mask_expanded, axis=1)
        sum_mask = np.clip(np.sum(input_mask_expanded, axis=1), a_min=1e-9, a_max=None)
        embeddings = sum_embeddings / sum_mask
        
        # Step 4: Normalize so we can compare vectors easily using Cosine Similarity
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        embeddings = embeddings / norms
        
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

knowledge_collection = client.get_or_create_collection(
    name="knowledge_items",
    embedding_function=embedding_fn
)

print("✅ Semantic Vector Database Initialized Successfully!")
