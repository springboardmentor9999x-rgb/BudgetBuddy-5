import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_otp_email(receiver_email: str, otp: str):

    subject = "BudgetBuddy - Email Verification"

    body = f"""
Hello,

Welcome to BudgetBuddy!

Your Email Verification Code is:

{otp}

This OTP is valid for 10 minutes.

If you didn't create this account, please ignore this email.

Regards,
BudgetBuddy Team
"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = receiver_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        print("OTP email sent successfully.")

    except Exception as e:
        print("Email Error:", e)
        raise