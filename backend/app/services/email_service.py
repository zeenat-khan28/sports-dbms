import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Tuple
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.provider = settings.EMAIL_PROVIDER
        self.server = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.sender = settings.EMAIL_FROM

    def _connect_smtp(self):
        try:
            server = smtplib.SMTP(self.server, self.port)
            server.starttls()
            server.login(self.user, self.password)
            return server
        except Exception as e:
            logger.error(f"Failed to connect to SMTP server: {e}")
            raise e

    def send_batch(self, recipients: List[Dict[str, str]], subject: str, body_template: str) -> Tuple[int, int]:
        """
        Sends emails to a batch of recipients.
        recipients arguments: List of dicts with 'email' and replacement variables like 'name', 'usn'.
        Returns: (success_count, failure_count)
        """
        if not self.user or not self.password:
            logger.error("SMTP credentials not configured.")
            return 0, len(recipients)

        success = 0
        failure = 0
        
        try:
            server = self._connect_smtp()
        except Exception:
            return 0, len(recipients)

        for recipient in recipients:
            try:
                # Personalize body
                personal_body = body_template.replace("\n", "<br>")
                # Default replacements
                replacements = {
                    "{{student_name}}": recipient.get("name", "Student"),
                    "{{usn}}": recipient.get("usn", "N/A"),
                    "{{branch}}": recipient.get("branch", "N/A"),
                    "{{semester}}": str(recipient.get("semester", "")),
                }
                
                # Apply replacements
                for key, value in replacements.items():
                    personal_body = personal_body.replace(key, value)

                # Create Message
                msg = MIMEMultipart()
                msg['From'] = self.sender
                msg['To'] = recipient['email']
                msg['Subject'] = subject
                msg.attach(MIMEText(personal_body, 'html'))

                # Send
                server.send_message(msg)
                success += 1
            except Exception as e:
                logger.error(f"Failed to send to {recipient.get('email')}: {e}")
                failure += 1
                # Try reconnecting if connection dropped
                try:
                    server.noop()
                except:
                    try:
                        server = self._connect_smtp()
                    except:
                        break # Abort if server totally lost

        try:
            server.quit()
        except:
            pass

        return success, failure

    def send_single_email(self, to_email: str, subject: str, body: str, recipient_name: str = "Student") -> bool:
        """
        Send a single email. Used for event notifications.
        Returns True if successful, False otherwise.
        """
        if not self.user or not self.password:
            logger.error("SMTP credentials not configured.")
            return False
        
        if not to_email or "@" not in to_email:
            logger.warning(f"Invalid email address: {to_email}")
            return False

        try:
            server = self._connect_smtp()
            
            # Replace variables
            personal_body = body.replace("\n", "<br>")
            personal_body = personal_body.replace("{{student_name}}", recipient_name)
            
            msg = MIMEMultipart()
            msg['From'] = self.sender
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(personal_body, 'html'))
            
            server.send_message(msg)
            server.quit()
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

email_service = EmailService()
