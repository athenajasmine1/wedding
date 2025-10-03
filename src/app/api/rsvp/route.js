
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.FROM_EMAIL || "Wedding <onboarding@resend.dev>";
const ADMIN  = process.env.ADMIN_EMAIL || "jasmineathea.deleon@gmail.com";

// Fail fast if env is missing (helps during dev)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[rsvp] Missing Supabase env vars");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const payload = await req.json();

    // Basic validation
    if (!payload.firstName || !payload.lastName || !payload.email) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const attending = String(payload.attending || "yes") === "yes";
    const record = {
      first_name: payload.firstName,
      last_name : payload.lastName,
      email     : payload.email,
      phone     : payload.phone ?? null,
      attending,
      guests    : Number(payload.guests ?? 1),
      diet      : payload.diet ?? null,
      message   : payload.message ?? null,
    };

    // 1) Save to Supabase
    const { data, error } = await supabase.from("rsvps").insert([record]).select().single();
    if (error) throw error;

    // 2) Email the guest
    try {
      await resend.emails.send({
        from: FROM,
        to: record.email,
        reply_to: ADMIN,
        subject: "RSVP Confirmation 💍",
        html: `
          <p>Hi ${record.first_name},</p>
          <p>Thank you for your RSVP! ${
            record.attending ? "We can’t wait to celebrate with you" : "We’re sorry you can’t make it"
          } on <strong>April 25, 2026</strong>.</p>
          <p><strong>Guests:</strong> ${record.guests}<br/>
             <strong>Dietary:</strong> ${record.diet || "—"}<br/>
             <strong>Message:</strong> ${record.message || "—"}</p>
          <p>— John &amp; Kristine</p>
        `,
      });
    } catch (e) {
      console.error("Guest email failed:", e);
    }

    // 3) Email the admin
    try {
      await resend.emails.send({
        from: FROM,
        to: ADMIN,
        subject: "New RSVP Received",
        html: `
          <p><strong>${record.first_name} ${record.last_name}</strong> submitted an RSVP.</p>
          <ul>
            <li>Email: ${record.email}</li>
            <li>Phone: ${record.phone || "—"}</li>
            <li>Attending: ${record.attending ? "Yes" : "No"}</li>
            <li>Guests: ${record.guests}</li>
            <li>Dietary: ${record.diet || "—"}</li>
            <li>Message: ${record.message || "—"}</li>
          </ul>
          <p>RSVP id: ${data.id}</p>
        `,
      });
    } catch (e) {
      console.error("Admin email failed:", e);
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
