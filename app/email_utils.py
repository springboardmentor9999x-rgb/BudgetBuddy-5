import os
import resend


def send_otp_email(to_email: str, otp: str):
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv(
        "RESEND_FROM_EMAIL",
        "onboarding@resend.dev"
    )

    if not api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = api_key

    params = {
        "from": from_email,
        "to": [to_email],
        "subject": "Budget Buddy - Email Verification OTP",
        "html": f"""
        <html>
        <body>
            <h2>Budget Buddy</h2>

            <p>Your email verification OTP is:</p>

            <h1>{otp}</h1>

            <p>This OTP is valid for 10 minutes.</p>

            <p>If you did not create a Budget Buddy account,
            please ignore this email.</p>
        </body>
        </html>
        """
    }

    email = resend.Emails.send(params)

    print("OTP email sent successfully:", email)

    return email