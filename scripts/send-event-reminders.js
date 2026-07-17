/**
 * Envoie les rappels J-7 et J-1 pour les billets à venir.
 * Usage : node scripts/send-event-reminders.js
 * Cron suggéré : 0 9 * * * (tous les jours à 9h)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");

const prisma = new PrismaClient();

function dayBounds(daysFromNow) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[reminders:dev]", subject, to);
    return;
  }
  const resend = new Resend(key);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "VerifyMyTicket <contact@verifymyticket.fr>",
    to,
    subject,
    html,
  });
}

async function main() {
  const windows = [
    { days: 7, label: "J-7" },
    { days: 1, label: "J-1" },
  ];

  let sent = 0;
  for (const w of windows) {
    const { start, end } = dayBounds(w.days);
    const tickets = await prisma.ticket.findMany({
      where: {
        eventDate: { gte: start, lt: end },
      },
      include: { owner: true },
    });

    for (const t of tickets) {
      if (!t.owner?.email) continue;
      const eventLabel = [t.eventName, t.city, t.venue]
        .filter(Boolean)
        .join(" · ");
      const subject =
        w.days === 1
          ? "Votre événement est demain — VerifyMyTicket"
          : `J-${w.days} avant votre événement — VerifyMyTicket`;
      const html = `<p>Rappel ${w.label} : <strong>${eventLabel}</strong></p>
<p>Vérifiez une dernière fois vos alertes sur VerifyMyTicket.</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/events">Voir mes événements</a></p>`;
      await sendEmail(t.owner.email, subject, html);
      sent += 1;
    }
  }

  console.log(`Reminders sent: ${sent}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
