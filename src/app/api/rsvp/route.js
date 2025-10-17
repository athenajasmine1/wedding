
// src/app/api/rsvp/route.js
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

console.log("[/api/rsvp] loaded");

// --- Resend (prod: verify your domain or use onboarding@resend.dev)
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "Weddings <onboarding@resend.dev>";

// --- Supabase (use SERVICE ROLE on the server)
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

    // Basic validation
    if (!payload.firstName || !payload.lastName || !payload.email) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    const attending =
      Boolean(payload.attending) ||
      String(payload.attending || "yes").toLowerCase() === "yes";

    const record = {
      first_name: payload.firstName,
      last_name : payload.lastName,
      email     : payload.email,
      phone     : payload.phone ?? null,
      attending,
      guests    : Number(payload.guests ?? payload.guestsCount ?? 1),
      diet      : payload.diet ?? null,
      message   : payload.message ?? null,
      group_id  : payload.groupId ?? null,
    };

    // ----------------------------------------------------
    // 1) Save to Supabase (continue on duplicates 23505)
    // ----------------------------------------------------
    let saved = null;
    let duplicate = false;

    const insertRes = await supabase
      .from("rsvps")
      .insert([record])
      .select()
      .single();

    if (insertRes.error) {
      if (insertRes.error.code === "23505") {
        // Unique violation -> fetch existing row so we still email + return id
        duplicate = true;
        const exist = await supabase
          .from("rsvps")
          .select("*")
          .eq("first_name", record.first_name)
          .eq("last_name",  record.last_name)
          .eq("group_id",   record.group_id)
          .limit(1)
          .single();

        if (exist.error) {
          console.error("[/api/rsvp] fetch-on-duplicate failed:", exist.error);
          return Response.json(
            { ok: false, error: "Duplicate RSVP", details: exist.error.message },
            { status: 409 }
          );
        }
        saved = exist.data;
      } else {
        console.error("[/api/rsvp] insert error:", insertRes.error);
        throw insertRes.error;
      }
    } else {
      saved = insertRes.data;
    }

    // ----------------------------------------------------
    // 2) Compose & send emails
    // ----------------------------------------------------
    const SITE = process.env.SITE_NAME || "Our Wedding";

    const adminList = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const guestTo = String(record.email || "").trim();

    console.log("[/api/rsvp] guestTo:", guestTo);
    console.log("[/api/rsvp] adminList:", adminList);

    const familyList = (payload.selectedList || []).map(n => `<li>${n}</li>`).join("");
    const familyHtml = familyList ? `<ul>${familyList}</ul>` : "<em>None</em>";

    const userHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h2>Thank you, ${record.first_name}!</h2>
        <p>We’ve received your RSVP${record.group_id ? ` for group <strong>${record.group_id}</strong>` : ""}.</p>
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
      `Thanks ${record.first_name}! We received your RSVP` +
      (record.group_id ? ` for group ${record.group_id}` : "") + `.\n` +
      `Attending: ${record.attending ? "Yes" : "No"}\n` +
      `Guests (incl. you): ${record.guests}\n` +
      (record.diet ? `Dietary: ${record.diet}\n` : "") +
      (record.message ? `Message: ${record.message}\n` : "") +
      `Family: ${(payload.selectedList || []).join(", ") || "None"}\n— John & Kristen`;

    const adminSubject =
      `New RSVP — ${record.first_name} ${record.last_name}` +
      (record.group_id ? ` (${record.group_id})` : "");

    const adminHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h3>New RSVP</h3>
        <table>
          <tr><td><strong>Name:</strong></td><td>${record.first_name} ${record.last_name}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${record.email}</td></tr>
          ${record.phone ? `<tr><td><strong>Phone:</strong></td><td>${record.phone}</td></tr>` : ""}
          ${record.group_id ? `<tr><td><strong>Group:</strong></td><td>${record.group_id}</td></tr>` : ""}
          <tr><td><strong>Attending:</strong></td><td>${record.attending ? "Yes" : "No"}</td></tr>
          <tr><td><strong>Guests (incl. them):</strong></td><td>${record.guests}</td></tr>
          ${record.diet ? `<tr><td><strong>Dietary:</strong></td><td>${record.diet}</td></tr>` : ""}
          ${record.message ? `<tr><td><strong>Message:</strong></td><td>${record.message}</td></tr>` : ""}
        </table>
        <p style="margin-top:12px"><strong>Family marked as coming:</strong></p>
        ${familyHtml}
        <p style="margin-top:12px">RSVP id: ${saved.id}</p>
      </div>
    `;

    const adminText =
      `New RSVP\nName: ${record.first_name} ${record.last_name}\nEmail: ${record.email}` +
      (record.phone ? `\nPhone: ${record.phone}` : "") +
      (record.group_id ? `\nGroup: ${record.group_id}` : "") +
      `\nAttending: ${record.attending ? "Yes" : "No"}\nGuests: ${record.guests}` +
      (record.diet ? `\nDietary: ${record.diet}` : "") +
      (record.message ? `\nMessage: ${record.message}` : "") +
      `\nFamily: ${(payload.selectedList || []).join(", ") || "None"}\nRSVP id: ${saved.id}`;

    const tasks = [];

    if (guestTo) {
      tasks.push(
        resend.emails
          .send({
            from: FROM,
            to: guestTo,
            subject: "RSVP Confirmation 💍",
            html: userHtml,
            text: userText,
            reply_to: adminList[0] || undefined,
          })
          .catch((e) => ({ error: e }))
      );
    } else {
      console.warn("[/api/rsvp] Skipping guest email: empty 'to'");
      tasks.push(Promise.resolve({ error: { message: "guestTo empty" } }));
    }

    if (adminList.length) {
      tasks.push(
        resend.emails
          .send({
            from: FROM,
            to: adminList,
            subject: adminSubject,
            html: adminHtml,
            text: adminText,
          })
          .catch((e) => ({ error: e }))
      );
    } else {
      console.warn("[/api/rsvp] Skipping admin email: ADMIN_EMAIL not set");
      tasks.push(Promise.resolve({ error: { message: "adminList empty" } }));
    }

    const [userSend, adminSend] = await Promise.all(tasks);
    console.log("[/api/rsvp] resend userSend:", userSend);
    console.log("[/api/rsvp] resend adminSend:", adminSend);

    return Response.json({
      ok: true,
      id: saved.id,
      duplicate,
      email: {
        userId: userSend?.data?.id || null,
        adminId: adminSend?.data?.id || null,
        userError: userSend?.error?.message || null,
        adminError: adminSend?.error?.message || null,
      },
    });
  } catch (err) {
    console.error("[/api/rsvp] error:", err);
    return Response.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
