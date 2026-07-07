import qrcode
import io
import base64
from PIL import Image

class QRService:
    @staticmethod
    def generate_qr_base64(serial_number: str, base_url: str = "http://localhost:5173/verify") -> str:
        """
        Generates a QR code for a given serial number and verification URL,
        returning it as a base64 encoded PNG string.
        """
        # Create verification link
        verification_link = f"{base_url}?serial={serial_number}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(verification_link)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to buffer
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        
        # Convert to base64
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"

    @staticmethod
    def generate_qr_bytes(serial_number: str, base_url: str = "http://localhost:5173/verify") -> bytes:
        """
        Generates raw PNG bytes of the QR code.
        """
        verification_link = f"{base_url}?serial={serial_number}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(verification_link)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return buffered.getvalue()
