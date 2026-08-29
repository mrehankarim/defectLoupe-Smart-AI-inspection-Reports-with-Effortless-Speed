"""
HTML email templates for DefectLoupe.
Uses table-based layout for broad email-client compatibility.
"""


def verification_email_html(
    user_name: str,
    verification_link: str,
    expiry_hours: int = 24,
) -> str:
    """Build the HTML body for the email-verification message."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify Your Email – DefectLoupe</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased;">

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Card -->
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);">

        <!-- Header band -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%); padding:36px 40px; text-align:center;">
            <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:-0.02em;">DefectLoupe</h1>
            <p style="margin:6px 0 0; color:#bfdbfe; font-size:14px;">Property Inspection Platform</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">

            <h2 style="margin:0 0 20px; color:#0f172a; font-size:22px; font-weight:600; line-height:1.3;">
              Welcome, {_escape(user_name)}!
            </h2>

            <p style="margin:0 0 16px; color:#475569; font-size:15px; line-height:1.7;">
              Thank you for creating your DefectLoupe account. Please verify your email
              address by clicking the button below so you can start managing your
              property inspections.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="border-radius:8px; background-color:#2563eb;">
                  <a href="{verification_link}"
                     style="display:inline-block; padding:14px 36px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; border-radius:8px; letter-spacing:0.01em;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px; color:#64748b; font-size:13px; line-height:1.6;">
              This link expires in <strong style="color:#475569;">{expiry_hours} hours</strong>.
              If you didn't create this account, you can safely ignore this email.
            </p>

            <!-- Fallback link -->
            <p style="margin:20px 0 0; color:#94a3b8; font-size:12px; line-height:1.5;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:4px 0 0; font-size:12px; line-height:1.5; word-break:break-all;">
              <a href="{verification_link}" style="color:#3b82f6; text-decoration:none;">
                {verification_link}
              </a>
            </p>

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px; text-align:center;">
            <p style="margin:0 0 6px; color:#94a3b8; font-size:12px; line-height:1.5;">
              &copy; DefectLoupe &mdash; Property Inspection &amp; Defect Tracking
            </p>
            <p style="margin:0; color:#cbd5e1; font-size:11px; line-height:1.5;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>
<!-- /Wrapper -->

</body>
</html>"""


def verification_email_text(user_name: str, verification_link: str, expiry_hours: int = 24) -> str:
    """Plain-text fallback for the verification email."""
    return (
        f"Welcome, {user_name}!\n\n"
        f"Thank you for creating your DefectLoupe account.\n"
        f"Please verify your email by visiting the link below:\n\n"
        f"  {verification_link}\n\n"
        f"This link expires in {expiry_hours} hours.\n"
        f"If you did not create this account, you can safely ignore this email.\n\n"
        f"— DefectLoupe"
    )


def _escape(text: str) -> str:
    """Minimal HTML escaping for user-provided values."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
