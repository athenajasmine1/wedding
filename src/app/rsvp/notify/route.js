import { Resend } from 'resend';

export async function POST(req) {
  try {
    // 0) ENV sanity
    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { ok: false, error: 'Missing RESEND_API_KEY env var' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM =
      process.env.FROM_EMAIL?.trim() || 'onboarding@resend.dev'; // fallback works but verify domain for best delivery
    const ADMIN_LIST = (process.env.ADMIN_EMAIL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const SITE = process.env.SITE_NAME || 'Our Wedding';

    // 1) Parse body
    const payload = await req.json();
    const {
      firstName = '',
      lastName = '',
      email = '',
      attending = true,
      guestsCount,
      diet = '',
      message = '',
      groupId = '',
      selectedList = [],
      phone = '',
    } = payload || {};

    if (!email) {
      return Response.json(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // 2) Compose HTML/Text
    const familyHtml = selectedList.length
      ? `<ul>${selectedList.map((n) => `<li>${n}</li>`).join('')}</ul>`
      : '<em>No family selected</em>';

    const userSubject = `RSVP received — ${SITE}`;
    const userHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h2>Thank you, ${firstName}!</h2>
        <p>We’ve received your RSVP${groupId ? ` for group <strong>${groupId}</strong>` : ''}.</p>
        <table style="margin-top:8px">
          <tr><td><strong>Name:</strong></td><td>${firstName} ${lastName}</td></tr>
          <tr><td><strong>Attending:</strong></td><td>${attending ? 'Yes' : 'No'}</td></tr>
          <tr><td><strong>Total guests (incl. you):</strong></td><td>${guestsCount ?? ''}</td></tr>
          ${diet ? `<tr><td><strong>Dietary:</strong></td><td>${diet}</td></tr>` : ''}
          ${message ? `<tr><td><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
        </table>
        <p style="margin-top:12px"><strong>Family marked as coming:</strong></p>
        ${familyHtml}
        <p style="margin-top:16px">If anything changes, just reply to this email.</p>
        <p>— John & Kristen</p>
      </div>
    `;
    const userText = `Thanks ${firstName}! We received your RSVP${groupId ? ` for group ${groupId}` : ''}.
Attending: ${attending ? 'Yes' : 'No'}
Guests (incl. you): ${guestsCount ?? ''}${diet ? `\nDietary: ${diet}` : ''}${message ? `\nMessage: ${message}` : ''}
Family: ${selectedList.join(', ') || 'None'}
— John & Kristen`;

    const adminSubject = `New RSVP — ${firstName} ${lastName}${groupId ? ` (${groupId})` : ''}`;
    const adminHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h3>New RSVP</h3>
        <table>
          <tr><td><strong>Name:</strong></td><td>${firstName} ${lastName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
          ${phone ? `<tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>` : ''}
          ${groupId ? `<tr><td><strong>Group:</strong></td><td>${groupId}</td></tr>` : ''}
          <tr><td><strong>Attending:</strong></td><td>${attending ? 'Yes' : 'No'}</td></tr>
          <tr><td><strong>Guests (incl. them):</strong></td><td>${guestsCount ?? ''}</td></tr>
          ${diet ? `<tr><td><strong>Dietary:</strong></td><td>${diet}</td></tr>` : ''}
          ${message ? `<tr><td><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
        </table>
        <p style="margin-top:12px"><strong>Family marked as coming:</strong></p>
        ${familyHtml}
      </div>
    `;
    const adminText = `New RSVP
Name: ${firstName} ${lastName}
Email: ${email}${phone ? `\nPhone: ${phone}` : ''}${groupId ? `\nGroup: ${groupId}` : ''}
Attending: ${attending ? 'Yes' : 'No'}
Guests (incl. them): ${guestsCount ?? ''}${diet ? `\nDietary: ${diet}` : ''}${message ? `\nMessage: ${message}` : ''}
Family: ${selectedList.join(', ') || 'None'}`;

    // 3) Send both emails (guest + admin). If no ADMIN_EMAIL, skip admin.
    const tasks = [
      resend.emails.send({
        from: FROM,             // e.g., "Weddings <noreply@johnandkristen.ca>"
        to: email,              // guest email
        subject: userSubject,
        html: userHtml,
        text: userText,
        reply_to: ADMIN_LIST[0] || undefined, // replies go to you
      }),
    ];

    if (ADMIN_LIST.length) {
      tasks.push(
        resend.emails.send({
          from: FROM,
          to: ADMIN_LIST,
          subject: adminSubject,
          html: adminHtml,
          text: adminText,
        })
      );
    }

    await Promise.all(tasks);

    return Response.json({ ok: true });
  } catch (e) {
    console.error('RSVP email error:', e);
    const msg =
      typeof e === 'object' && e && 'message' in e ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
