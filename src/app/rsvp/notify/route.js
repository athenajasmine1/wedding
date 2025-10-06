import { Resend } from 'resend';

export async function POST(req) {
  try {
    const payload = await req.json();
    const {
      firstName, lastName, email, attending, guestsCount, diet, message,
      groupId, selectedList = []  // array of strings (names checked as coming)
    } = payload;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const site = process.env.SITE_NAME || 'Our Wedding';

    // Build simple HTML blocks
    const familyHtml = selectedList.length
      ? `<ul>${selectedList.map(n => `<li>${n}</li>`).join('')}</ul>`
      : '<em>No family selected</em>';

    // 1) Guest confirmation
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `RSVP received — ${site}`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <h2>Thank you, ${firstName}!</h2>
          <p>We received your RSVP${
            groupId ? ` for group <strong>${groupId}</strong>` : ''
          }.</p>
          <p><strong>Attending:</strong> ${attending ? 'Yes' : 'No'}</p>
          <p><strong>Total guests (incl. you):</strong> ${guestsCount ?? ''}</p>
          ${diet ? `<p><strong>Dietary:</strong> ${diet}</p>` : ''}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p><strong>Family marked as coming:</strong></p>
          ${familyHtml}
          <p style="margin-top:16px">If anything changes, reply to this email.</p>
        </div>
      `,
    });

    

    // 2) Admin alert
    const adminTo = (process.env.ADMIN_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean);
    if (adminTo.length) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: adminTo,
        subject: `New RSVP — ${firstName} ${lastName} ${groupId ? `(${groupId})` : ''}`,
        html: `
          <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
            <h3>New RSVP</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${groupId ? `<p><strong>Group:</strong> ${groupId}</p>` : ''}
            <p><strong>Attending:</strong> ${attending ? 'Yes' : 'No'}</p>
            <p><strong>Guests (incl. them):</strong> ${guestsCount ?? ''}</p>
            ${diet ? `<p><strong>Dietary:</strong> ${diet}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <p><strong>Family marked as coming:</strong></p>
            ${familyHtml}
          </div>
        `,
      });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
