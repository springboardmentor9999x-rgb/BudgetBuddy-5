import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_verification_email(receiver_email: str, otp: str):

    msg = EmailMessage()

    msg["Subject"] = "BudgetBuddy Email Verification"
    msg["From"] = SMTP_EMAIL
    msg["To"] = receiver_email

    msg.set_content(f"""
Hello,

Your BudgetBuddy verification code is:

{otp}

This OTP expires in 5 minutes.

If you didn't request this account,
please ignore this email.

Regards,
BudgetBuddy
""")

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
        smtp.send_message(msg)