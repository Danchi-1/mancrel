from ....ml.training.train import class_model

from unsloth import FastLanguageModel
import torch

max_seq_length = 2048
dtype = None
load_in_4bit = True

resp_model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3-8b-bnb-4bit",
    max_seq_length=max_seq_length,
    dtype=dtype,
    load_in_4bit=load_in_4bit
)

resp_model = FastLanguageModel.get_peft_model(
    resp_model,
    r=16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj",],
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state = 3407,
    use_rslora=False,
    loftq_config = None,
)

if torch.cuda.is_available():
    resp_model = resp_model.cuda()
    class_model = class_model.cuda()
    print("Models moved to GPU.")
else:
    print("CUDA is not available. Models are on CPU.")

resp_model.eval()
class_model.eval()