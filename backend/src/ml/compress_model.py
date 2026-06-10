"""
compress_model.py
=================
This script takes a standard 32-bit floating point PyTorch model
and compresses it to an 8-bit integer (INT8) ONNX model using quantization.

Run this script from your terminal:
$ cd backend/src
$ source ../.venv_temp/bin/activate
$ pip install optimum[onnxruntime] sentence-transformers
$ python3 ml/compress_model.py
"""

import os
import time
from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer

def main():
    model_id = "sentence-transformers/all-MiniLM-L6-v2"
    save_dir = "ml/models/all-MiniLM-L6-v2-quantized"
    
    print(f"Loading {model_id} and converting to ONNX format...")
    start_time = time.time()
    
    # 1. Load the tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    
    # 2. Load the model and convert it to ONNX format on-the-fly
    # Setting export=True automatically converts PyTorch -> ONNX
    model = ORTModelForFeatureExtraction.from_pretrained(model_id, export=True)
    
    # 3. Create the save directory if it doesn't exist
    os.makedirs(save_dir, exist_ok=True)
    
    # 4. Save the full precision ONNX model locally
    tokenizer.save_pretrained(save_dir)
    model.save_pretrained(save_dir)
    print(f"Model saved to {save_dir} in {time.time() - start_time:.2f}s")
    
    print("\n--- NOW BEGINNING QUANTIZATION ---")
    print("We are compressing the 32-bit float weights into 8-bit integers (INT8).")
    print("This will drastically reduce the file size with almost 0 loss in accuracy.\n")
    
    # 5. Apply dynamic quantization to shrink the model
    from optimum.onnxruntime.configuration import AutoQuantizationConfig
    from optimum.onnxruntime import ORTQuantizer
    
    quantizer = ORTQuantizer.from_pretrained(model)
    # ARM64 (Macs) use 'avx2' or 'arm64', but 'avx2' works generally for CPUs
    dqconfig = AutoQuantizationConfig.avx2(is_static=False, per_channel=False)
    
    quantized_dir = "ml/models/all-MiniLM-L6-v2-int8"
    os.makedirs(quantized_dir, exist_ok=True)
    
    quantizer.quantize(save_dir=quantized_dir, quantization_config=dqconfig)
    tokenizer.save_pretrained(quantized_dir)
    
    # Compare sizes
    original_size = os.path.getsize(os.path.join(save_dir, "model.onnx")) / (1024 * 1024)
    quantized_size = os.path.getsize(os.path.join(quantized_dir, "model_quantized.onnx")) / (1024 * 1024)
    
    print(f"Compression Complete!")
    print(f"Original ONNX Size:  {original_size:.2f} MB")
    print(f"Quantized INT8 Size: {quantized_size:.2f} MB")
    print(f"Compression Ratio:   {original_size/quantized_size:.2f}x smaller!")

if __name__ == "__main__":
    main()
