/**
 * Layout HTML emails — palette alignée sur le site (fond sombre, accent teal).
 * Tables + styles inline pour compatibilité clients mail.
 */

const COLORS = {
  bg: "#07090d",
  card: "#121821",
  elevated: "#0e1219",
  border: "#1e2736",
  text: "#e8edf5",
  muted: "#8b97ab",
  accent: "#2dd4bf",
  accentDim: "#14b8a6",
  danger: "#f87171",
  warning: "#fbbf24",
  success: "#34d399",
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ title: string, preheader?: string, bodyHtml: string, appUrl: string }} opts
 */
export function renderEmailLayout({ title, preheader = "", bodyHtml, appUrl }) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};color:${COLORS.text};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${safePreheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;color:${COLORS.accent};font-size:22px;font-weight:700;letter-spacing:-0.02em;">
                VerifyMyTicket
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;padding:28px 28px 24px 28px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.3;font-weight:600;color:${COLORS.text};">
                ${safeTitle}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0 8px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;line-height:1.5;color:${COLORS.muted};">
                © ${year} VerifyMyTicket — détection de reventes de billets
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${COLORS.muted};">
                <a href="${escapeHtml(appUrl)}" style="color:${COLORS.accent};text-decoration:none;">verifymyticket.fr</a>
                ·
                <a href="${escapeHtml(appUrl)}/confidentialite" style="color:${COLORS.muted};text-decoration:underline;">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paragraph(text) {
  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:${COLORS.text};">${text}</p>`;
}

export function mutedParagraph(text) {
  return `<p style="margin:0 0 14px 0;font-size:13px;line-height:1.5;color:${COLORS.muted};">${text}</p>`;
}

export function primaryButton(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
      <tr>
        <td style="border-radius:10px;background-color:${COLORS.accent};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#042f2e;text-decoration:none;border-radius:10px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function infoBox(html) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="background-color:${COLORS.elevated};border:1px solid ${COLORS.border};border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.5;color:${COLORS.text};">
          ${html}
        </td>
      </tr>
    </table>`;
}

export function warningBox(html) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="background-color:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.5;color:${COLORS.warning};">
          ${html}
        </td>
      </tr>
    </table>`;
}

export function strong(text) {
  return `<strong style="color:${COLORS.text};font-weight:600;">${escapeHtml(text)}</strong>`;
}

export { COLORS, escapeHtml };
