export interface InvitationEmailProps {
  inviteeName: string | null; // Name of the invitee if they have an account
  inviterName: string | null; // Name of the person who sent the invitation
  workspaceName: string;
  workspaceIcon: string;
  role: string; // "admin" or "member"
  acceptUrl: string; // URL with token to accept invitation
  declineUrl: string; // URL with token to decline invitation
  expiresAt: Date;
}

export function getInvitationEmailHtml({
  inviteeName,
  inviterName,
  workspaceName,
  workspaceIcon,
  role,
  acceptUrl,
  declineUrl,
  expiresAt,
}: InvitationEmailProps): string {
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hi there";
  const inviterText = inviterName || "Someone";
  const roleText = role === "admin" ? "an admin" : "a member";
  const expirationDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${workspaceName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 560px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px 40px; text-align: center;">
              <img src="https://notto.site/notto-logo.png" alt="Notto" style="height: 32px; width: auto;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">
                You're invited to join a workspace
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252;">
                ${greeting},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252;">
                ${inviterText} has invited you to join <strong style="color: #171717;">${workspaceIcon} ${workspaceName}</strong> as ${roleText}.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #525252;">
                Click the button below to accept the invitation and start collaborating.
              </p>
              
              <!-- CTA Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #171717; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${declineUrl}" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #737373; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px;">
                      Decline
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #737373; text-align: center;">
                This invitation expires on <strong>${expirationDate}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;" />
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 16px; color: #a3a3a3; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 16px; color: #a3a3a3; text-align: center; word-break: break-all;">
                <a href="${acceptUrl}" style="color: #f97316; text-decoration: none;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Brand Footer -->
        <table role="presentation" style="width: 100%; max-width: 560px; border-collapse: collapse;">
          <tr>
            <td style="padding: 24px 20px; text-align: center;">
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

export function getInvitationEmailText({
  inviteeName,
  inviterName,
  workspaceName,
  workspaceIcon,
  role,
  acceptUrl,
  declineUrl,
  expiresAt,
}: InvitationEmailProps): string {
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hi there";
  const inviterText = inviterName || "Someone";
  const roleText = role === "admin" ? "an admin" : "a member";
  const expirationDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
You're invited to join ${workspaceIcon} ${workspaceName}

${greeting},

${inviterText} has invited you to join ${workspaceIcon} ${workspaceName} as ${roleText}.

Role: ${role.charAt(0).toUpperCase() + role.slice(1)}

To accept this invitation, click the link below:
${acceptUrl}

To decline this invitation, click here:
${declineUrl}

This invitation expires on ${expirationDate}.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Notto. All rights reserved.
  `.trim();
}
