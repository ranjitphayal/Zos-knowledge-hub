import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from app.config import get_settings


class EmailDeliveryError(RuntimeError):
    pass


async def send_email(recipient: str, subject: str, body: str) -> None:
    settings = get_settings()
    if not settings.email_password_enabled:
        raise EmailDeliveryError("Email delivery is not configured.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
    message["To"] = recipient
    message.set_content(body)

    def deliver() -> None:
        try:
            if settings.smtp_use_ssl:
                with smtplib.SMTP_SSL(
                    settings.smtp_host,
                    settings.smtp_port,
                    timeout=15,
                    context=ssl.create_default_context(),
                ) as client:
                    client.login(settings.smtp_username, settings.smtp_password)
                    client.send_message(message)
                return

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as client:
                if settings.smtp_starttls:
                    client.starttls(context=ssl.create_default_context())
                client.login(settings.smtp_username, settings.smtp_password)
                client.send_message(message)
        except (OSError, smtplib.SMTPException) as exc:
            raise EmailDeliveryError("The email provider rejected or could not deliver the message.") from exc

    await asyncio.to_thread(deliver)
