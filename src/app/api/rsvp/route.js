
// src/app/api/rsvp/route.js
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

console.log("[/api/rsvp] loaded");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.FROM_EMAIL || "Weddings <noreply@johnandkristen.ca>";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[/api/rsvp] Missing Supabase env vars");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  console.log("[/api/rsvp] HIT");
  try {
    const payload = await req.json();
    console.log("[/api/rsvp] payload", payload);

    // basic validation
    if (!payload.firstName || !payload.lastName || !payload.email) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    const attending = Boolean(payload.attending ?? (String(payload.attending || "yes") === "yes"));
    const record = {
      first_name: payload.firstName,
      last_name : payload.lastName,
      email     : payload.email,
      phone     : payload.phone ?? null,
      attending,
      guests    : Number(payload.guests ?? payload.guestsCount ?? 1),
      diet      : payload.diet ?? null,
      message   : payload.message ?? null,
      group_ID  : payload.groupId ?? null,
    };

    // 1) Save to Supabase
    const { data, error } = await supabase.from("rsvps").insert([record]).select().single();
    if (error) throw error;

    // -------------------------------------------------------
    // 2) EMAILS — guarded sends + useful logs (this is the part you asked for)
    // -------------------------------------------------------
    const SITE = process.env.SITE_NAME || "Our Wedding";
    const adminList = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const guestTo = String(record.email || "").trim();
    console.log("[/api/rsvp] guestTo:", guestTo);
    console.log("[/api/rsvp] adminList:", adminList);

    // compose bodies
    const familyList  = (payload.selectedList || []).map(n => `<li>${n}</li>`).join("");
    const familyHtml  = familyList ? `<ul>${familyList}</ul>` : "<em>No family selected</em>";

    const userHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h2>Thank you, ${record.first_name}!</h2>
        <p>We’ve received your RSVP${record.group_ID ? ` for group <strong>${record.group_ID}</strong>` : ""}.</p>
        <table style="margin-top:8px">
          <tr><td><strong>Name:</strong></td><td>${record.first_name} ${record.last_name}</td></tr>
          <tr><td><strong>Attending:</strong></td><td>${record.attending ? "Yes" : "No"}</td></tr>
          <tr><td><strong>Total guests (incl. you):</strong></td><td>${record.guests}</td></tr>
          ${record.diet ? `<tr><td><strong>Dietary:</strong></td><td>${record.diet}</td></tr>` : ""}
          ${record.message ? `<tr><td><strong>Message:</strong></td><td>${record.message}</td></tr>` : ""}
        </table>
        <p style="margin-top:12px"><strong>Family marked as coming:</strong></p>
        ${familyHtml}
        <p style="margin-top:16px">If anything changes, just reply to this email.</p>
        <p>— John & Kristen</p>
      </div>
    `;
    const userText =
      `Thanks ${record.first_name}! We received your RSVP${record.group_ID ? ` for group ${record.group_ID}` : ""}.\n` +
      `Attending: ${record.attending ? "Yes" : "No"}\n` +
      `Guests (incl. you): ${record.guests}\n` +
      (record.diet ? `Dietary: ${record.diet}\n` : "") +
      (record.message ? `Message: ${record.message}\n` : "") +
      `Family: ${(payload.selectedList || []).join(", ") || "None"}\n— John & Kristen`;

    const adminSubject = `New RSVP — ${record.first_name} ${record.last_name}${record.group_ID ? ` (${record.group_ID})` : ""}`;
    const adminHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h3>New RSVP</h3>
        <table>
          <tr><td><strong>Name:</strong></td><td>${record.first_name} ${record.last_name}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${record.email}</td></tr>
          ${record.phone ? `<tr><td><strong>Phone:</strong></td><td>${record.phone}</td></tr>` : ""}
          ${record.group_ID ? `<tr><td><strong>Group:</strong></td><td>${record.group_ID}</td></tr>` : ""}
          <tr><td><strong>Attending:</strong></td><td>${record.attending ? "Yes" : "No"}</td></tr>
          <tr><td><strong>Guests (incl. them):</strong></td><td>${record.guests}</td></tr>
          ${record.diet ? `<tr><td><strong>Dietary:</strong></td><td>${record.diet}</td></tr>` : ""}
          ${record.message ? `<tr><td><strong>Message:</strong></td><td>${record.message}</td></tr>` : ""}
        </table>
        <p style="margin-top:12px"><strong>Family marked as coming:</strong></p>
        ${familyHtml}
        <p style="margin-top:12px">RSVP id: ${data.id}</p>
      </div>
    `;
    const adminText =
      `New RSVP\nName: ${record.first_name} ${record.last_name}\nEmail: ${record.email}` +
      (record.phone ? `\nPhone: ${record.phone}` : "") +
      (record.group_ID ? `\nGroup: ${record.group_ID}` : "") +
      `\nAttending: ${record.attending ? "Yes" : "No"}\nGuests: ${record.guests}` +
      (record.diet ? `\nDietary: ${record.diet}` : "") +
      (record.message ? `\nMessage: ${record.message}` : "") +
      `\nFamily: ${(payload.selectedList || []).join(", ") || "None"}\nRSVP id: ${data.id}`;

    // Build send promises only if we have a valid "to"
    const tasks = [];

    if (guestTo) {
      tasks.push(
        resend.emails.send({
          from: FROM,
          to: guestTo, // string or array; must be non-empty
          subject: "RSVP Confirmation 💍",
          html: userHtml,
          text: userText,
          reply_to: adminList[0] || undefined,
        })
      );
    } else {
      console.warn("[/api/rsvp] Skipping guest email: empty 'to'");
      tasks.push(Promise.resolve({ data: null, error: { message: "guestTo empty" } }));
    }

    if (adminList.length) {
      tasks.push(
        resend.emails.send({
          from: FROM,
          to: adminList, // array of admin emails
          subject: adminSubject,
          html: adminHtml,
          text: adminText,
        })
      );
    } else {
      console.warn("[/api/rsvp] Skipping admin email: ADMIN_EMAIL not set");
      tasks.push(Promise.resolve({ data: null, error: { message: "adminList empty" } }));
    }

    const [userSend, adminSend] = await Promise.all(tasks);

    console.log("[/api/rsvp] resend userSend:", userSend);
    console.log("[/api/rsvp] resend adminSend:", adminSend);

    return Response.json({
      ok: true,
      id: data.id,
      email: {
        userId: userSend?.data?.id || null,
        adminId: adminSend?.data?.id || null,
        userError: userSend?.error?.message || null,
        adminError: adminSend?.error?.message || null,
      },
    });
    // -------------------------------------------------------

  } catch (err) {
    console.error("[/api/rsvp] error:", err);
    return Response.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
