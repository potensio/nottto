export interface VerificationCodeEmailProps {
  code: string;
  expirationMinutes: number;
}

export function getVerificationCodeEmailHtml(
  props: VerificationCodeEmailProps,
): string {
  const { code, expirationMinutes } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Notto Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">Notto</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #171717;">Your Verification Code</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                Enter this code in the Notto extension to complete your authentication:
              </p>
              
              <!-- Verification Code -->
              <div style="background-color: #fafafa; border: 2px solid #e5e5e5; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #171717; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #737373;">
                This code will expire in <strong>${expirationMinutes} minutes</strong>.
              </p>
              
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #737373;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                © ${new Date().getFullYear()} Notto. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getVerificationCodeEmailText(
  props: VerificationCodeEmailProps,
): string {
  const { code, expirationMinutes } = props;

  return `
Your Notto Verification Code

Enter this code in the Notto extension to complete your authentication:

${code}

This code will expire in ${expirationMinutes} minutes.

If you didn't request this code, you can safely ignore this email.

© ${new Date().getFullYear()} Notto. All rights reserved.
  `.trim();
}
