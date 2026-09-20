import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL")


def send_otp_email(receiver_email: str, otp: str):

    subject = "BudgetBuddy - Email Verification"

    body = f"""Hello,

Welcome to BudgetBuddy!

Your Email Verification Code is:

{otp}

This OTP is valid for 10 minutes.

If you didn't create this account, please ignore this email.

Regards,
BudgetBuddy Team
"""

    payload = {
        "sender": {
            "name": "BudgetBuddy",
            "email": BREVO_FROM_EMAIL
        },
        "to": [
            {
                "email": receiver_email
            }
        ],
        "subject": subject,
        "textContent": body
    }

    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=data,
        headers={
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response_body = response.read().decode("utf-8")
            print("OTP email sent successfully:", response_body)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print("Brevo Email Error:", error_body)
        raise

    except Exception as e:
        print("Email Error:", e)
        raise
