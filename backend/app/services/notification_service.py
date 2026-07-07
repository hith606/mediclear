import logging
from app.core.config import settings

logger = logging.getLogger("mediclear.notifications")

class NotificationService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str) -> bool:
        """
        Sends an email. Under mock mode, it outputs to console log.
        """
        if settings.MOCK_NOTIFICATIONS:
            logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject} | Body: {body[:150]}...")
            return True
        try:
            # Here you would integrate actual SMTP or SendGrid client:
            # from sendgrid import SendGridAPIClient
            # from sendgrid.helpers.mail import Mail
            # message = Mail(from_email=settings.FROM_EMAIL, to_emails=to_email, subject=subject, html_content=body)
            # sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            # sg.send(message)
            logger.info(f"Actual email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_sms(to_phone: str, message: str) -> bool:
        """
        Sends an SMS. Under mock mode, it outputs to console log.
        """
        if settings.MOCK_NOTIFICATIONS:
            logger.info(f"[MOCK SMS] To: {to_phone} | Message: {message}")
            return True
        try:
            # Here you would integrate actual Twilio client:
            # from twilio.rest import Client
            # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            # client.messages.create(body=message, from_=settings.TWILIO_FROM_NUMBER, to=to_phone)
            logger.info(f"Actual SMS sent to {to_phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
            return False
            
    @classmethod
    def notify_recall(cls, batch_number: str, stakeholders: list, medicine_name: str):
        """
        Sends alerts to list of stakeholders (emails/phones) regarding a batch recall.
        """
        subject = f"URGENT: Recall Issued for Batch {batch_number} of {medicine_name}"
        body = (
            f"Please be advised that a recall has been officially registered by the Regulatory Authority "
            f"for Batch Number: {batch_number} (Product: {medicine_name}).\n\n"
            f"If you hold units from this batch in your inventory, suspend all sales immediately and "
            f"initiate returns."
        )
        for contact in stakeholders:
            email = contact.get("email")
            phone = contact.get("phone_number")
            if email:
                cls.send_email(email, subject, body)
            if phone:
                cls.send_sms(phone, f"URGENT: Batch {batch_number} of {medicine_name} has been recalled. Stop sales immediately.")
