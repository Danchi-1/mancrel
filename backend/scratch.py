import re

def format_phone(phone_str):
    phone = phone_str.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not phone.startswith("whatsapp:"):
        phone = f"whatsapp:{phone}"
    if not phone.startswith("whatsapp:+"):
        phone = phone.replace("whatsapp:", "whatsapp:+")
    return phone

print(format_phone("whatsapp:+14155238886"))
print(format_phone("+1 415 523 8886"))
print(format_phone("14155238886"))
print(format_phone("whatsapp: 14155238886"))
