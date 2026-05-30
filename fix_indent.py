import os

file_path = "/home/danchi/Documents/code/mancrel/backend/src/api/v1/messaging/controllers.py"

with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    line_num = i + 1
    
    # process_meta_webhook_bg body is roughly 130 to 264
    # process_twilio_webhook_bg body is roughly 316 to 435
    
    # We want to indent these lines by 4 spaces because they were accidentally un-indented
    if (130 <= line_num <= 264) or (316 <= line_num <= 435):
        if line.strip() != "":
            # Indent by 4 spaces
            new_lines.append("    " + line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
