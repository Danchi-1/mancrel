import re

with open("backend/src/api/v1/messaging/pipeline.py", "r") as f:
    content = f.read()

# Fix classify()
content = content.replace("            model=model_to_use,", "            model=model_name,")
content = content.replace("            model=model_name,\n            messages=messages,", "            model=model_to_use,\n            messages=messages,")
# Actually, the 3 occurences in generate_reply can just use model_to_use
# Let's insert model_to_use = model_name before the try block in generate_reply
tool_end = """        }
    ]

    try:
        response = await client.chat.completions.create(
            model=model_to_use,"""

new_tool_end = """        }
    ]

    model_to_use = model_name
    if media_url:
        model_to_use = "google/gemini-1.5-flash"

    try:
        response = await client.chat.completions.create(
            model=model_to_use,"""

content = content.replace(tool_end, new_tool_end)

# Also check if notify_owner_receipt is in the tools schema. If not, add it.
if "notify_owner_receipt" not in content[:content.find("model_to_use = model_name")]:
    schema = """                    "required": ["customer_name", "issue_type"]
                }
            }
        ]"""
    new_schema = """                    "required": ["customer_name", "issue_type"]
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "notify_owner_receipt",
                    "description": "Trigger this when the customer uploads an image representing a payment receipt. It will notify the business owner to verify the payment.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            }
        ]"""
    content = content.replace(schema, new_schema)

with open("backend/src/api/v1/messaging/pipeline.py", "w") as f:
    f.write(content)
