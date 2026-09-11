import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def generate_otp_code() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_email(recipient_email: str, code: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart('alternative')
            # Use exact authenticated sender address for 100% SPF/DKIM/DMARC alignment
            msg['From'] = smtp_user
            msg['To'] = recipient_email
            msg['Subject'] = f"BudgetBuddy verification code: {code}"

            # Plain-text version
            text_body = f"""Hello,

Your BudgetBuddy email verification code is: {code}

Please enter this 6-digit code in BudgetBuddy to complete your registration. This code will expire in 15 minutes.

If you did not sign up for BudgetBuddy, please ignore this email.

Best regards,
BudgetBuddy Team
"""

            # Clean HTML version
            html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #4f46e5; margin-top: 0;">BudgetBuddy Verification</h2>
        <p style="font-size: 14px; color: #334155;">Hello,</p>
        <p style="font-size: 14px; color: #334155;">Your BudgetBuddy verification code is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">{code}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">This code will expire in 15 minutes.</p>
    </div>
</body>
</html>"""

            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"[Email Sent] Verification OTP successfully emailed to {recipient_email}")
            return True
        except Exception as e:
            print(f"[Email Error] Failed to send email via SMTP: {e}")

    # Fallback mode
    print(f"\n=======================================================")
    print(f" [DEV EMAIL SIMULATOR] Recipient: {recipient_email}")
    print(f" [DEV EMAIL SIMULATOR] Gmail Verification Code: {code}")
    print(f"=======================================================\n")
    return True

def send_premium_request_email_to_admin(admin_email: str, student_name: str, student_email: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    subject = f"⭐ Premium Upgrade Request from {student_name}"
    text_body = f"""
Hello Administrator,

Student user {student_name} ({student_email}) has submitted a request to upgrade their BudgetBuddy account to Premium.

Please review this request in your Admin Dashboard under User Management.

Best regards,
The BudgetBuddy Team
    """

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"BudgetBuddy <{smtp_user}>"
            msg['To'] = admin_email
            msg['Subject'] = subject
            msg.attach(MIMEText(text_body, 'plain'))

            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"[Email Sent] Premium upgrade request notification emailed to admin {admin_email}")
            return True
        except Exception as e:
            print(f"[Email Error] Failed to email admin via SMTP: {e}")

    print(f"\n=======================================================")
    print(f" [DEV EMAIL SIMULATOR] Admin Recipient: {admin_email}")
    print(f" [DEV EMAIL SIMULATOR] Upgrade Request from: {student_name} ({student_email})")
    print(f"=======================================================\n")
    return True

def send_premium_approval_email_to_user(recipient_email: str, student_name: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    subject = "BudgetBuddy Premium Account Approved"
    text_body = f"""Hello {student_name},

Great news! Your request to upgrade your BudgetBuddy account to Premium has been approved by the administrator.

You now have full access to:
- 12-Month Historical Trend Charts & Multi-Year Cashflow Analytics
- 30-Day AI Predictive Cashflow & Daily Burn Rate Forecasts
- Custom Date Range Filtering
- Visual Bar & Pie Chart PDF & Excel Statement Exports

Log in now to experience your new Premium features:
http://localhost:5173/login

Best regards,
BudgetBuddy Team
"""

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"BudgetBuddy <{smtp_user}>"
            msg['To'] = recipient_email
            msg['Subject'] = subject
            msg.attach(MIMEText(text_body, 'plain'))

            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"[Email Sent] Premium approval notification emailed to {recipient_email}")
            return True
        except Exception as e:
            print(f"[Email Error] Failed to email user via SMTP: {e}")

    print(f"\n=======================================================")
    print(f" [DEV EMAIL SIMULATOR] Recipient: {recipient_email}")
    print(f" [DEV EMAIL SIMULATOR] Premium Approval for: {student_name}")
    print(f"=======================================================\n")
    return True

def send_budget_alert_email(
    recipient_email: str,
    user_name: str,
    category: str,
    total_spent: float,
    budget_limit: float,
    percent_used: float,
    month_str: str,
    is_exceeded: bool
) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    if is_exceeded:
        subject = f"⚠️ Alert: Budget Exceeded for {category} ({month_str})"
        heading = f"Budget Exceeded Alert: {category}"
        status_color = "#dc2626"
        message_intro = f"You have spent <strong>${total_spent:,.2f}</strong> on <strong>{category}</strong>, exceeding your monthly budget limit of <strong>${budget_limit:,.2f}</strong> for {month_str}."
    else:
        subject = f"⚡ Warning: {percent_used:.1f}% Budget Spent for {category} ({month_str})"
        heading = f"Budget Warning Alert: {category}"
        status_color = "#d97706"
        message_intro = f"You have used <strong>{percent_used:.1f}%</strong> (${total_spent:,.2f} of ${budget_limit:,.2f}) of your monthly {category} budget for {month_str}."

    text_body = f"""Hello {user_name},

{heading}

{message_intro.replace('<strong>','').replace('</strong>','')}

Please check your BudgetBuddy dashboard to review your recent expenses and budget allocations.

Best regards,
BudgetBuddy Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: {status_color}; margin-top: 0;">{heading}</h2>
        <p style="font-size: 14px; color: #334155;">Hello {user_name},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">{message_intro}</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Category:</strong> {category}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Total Spent:</strong> ${total_spent:,.2f}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Monthly Budget:</strong> ${budget_limit:,.2f}</p>
            <p style="margin: 4px 0; font-size: 13px; color: {status_color}; font-weight: bold;"><strong>Utilization:</strong> {percent_used:.1f}%</p>
        </div>

        <p style="font-size: 12px; color: #64748b;">Log in to BudgetBuddy to adjust your budgets or manage expenses.</p>
    </div>
</body>
</html>"""

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = smtp_user
            msg['To'] = recipient_email
            msg['Subject'] = subject
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"[Email Sent] Budget alert email sent to {recipient_email}")
            return True
        except Exception as e:
            print(f"[Email Error] Failed to send budget alert email: {e}")

    print(f"\n=======================================================")
    print(f" [DEV EMAIL SIMULATOR] Budget Alert Email Recipient: {recipient_email}")
    print(f" [DEV EMAIL SIMULATOR] {subject}")
    print(f"=======================================================\n")
    return True

def send_savings_milestone_email(
    recipient_email: str,
    user_name: str,
    goal_title: str,
    current_amount: float,
    target_amount: float,
    percent_reached: float,
    is_completed: bool
) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    if is_completed:
        subject = f"🎉 Goal Achieved! 100% Target Met for '{goal_title}'"
        heading = f"Savings Goal Completed: {goal_title}"
        status_color = "#16a34a"
        message_intro = f"Congratulations {user_name}! You have reached 100% of your savings goal for <strong>'{goal_title}'</strong> by accumulating <strong>${current_amount:,.2f}</strong>!"
    else:
        subject = f"🎯 Milestone Reached: {percent_reached:.0f}% Saved for '{goal_title}'"
        heading = f"Savings Goal Milestone ({percent_reached:.0f}%): {goal_title}"
        status_color = "#2563eb"
        message_intro = f"Great progress {user_name}! You have saved <strong>{percent_reached:.1f}%</strong> (${current_amount:,.2f} of ${target_amount:,.2f}) for your <strong>'{goal_title}'</strong> goal."

    text_body = f"""Hello {user_name},

{heading}

{message_intro.replace('<strong>','').replace('</strong>','')}

Keep up the great financial habits with BudgetBuddy!

Best regards,
BudgetBuddy Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: {status_color}; margin-top: 0;">{heading}</h2>
        <p style="font-size: 14px; color: #334155;">Hello {user_name},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">{message_intro}</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Goal Title:</strong> {goal_title}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Current Balance:</strong> ${current_amount:,.2f}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Target Amount:</strong> ${target_amount:,.2f}</p>
            <p style="margin: 4px 0; font-size: 13px; color: {status_color}; font-weight: bold;"><strong>Progress:</strong> {percent_reached:.1f}%</p>
        </div>

        <p style="font-size: 12px; color: #64748b;">Log in to BudgetBuddy to track your goals or deposit funds.</p>
    </div>
</body>
</html>"""

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = smtp_user
            msg['To'] = recipient_email
            msg['Subject'] = subject
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"[Email Sent] Savings milestone email sent to {recipient_email}")
            return True
        except Exception as e:
            print(f"[Email Error] Failed to send savings milestone email: {e}")

    print(f"\n=======================================================")
    print(f" [DEV EMAIL SIMULATOR] Savings Milestone Email Recipient: {recipient_email}")
    print(f" [DEV EMAIL SIMULATOR] {subject}")
    print(f"=======================================================\n")
    return True
