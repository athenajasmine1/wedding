"use client";

import FadeInSection from "../components/FadeInSection";
import { useState, useMemo, useEffect } from 'react';
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { useRouter } from 'next/navigation';
import Countdown from "../components/Countdown";


export default function Home() {

  

// at top of the file with other hooks
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);


const [groupId, setGroupId] = useState("");
const [family, setFamily] = useState([]);              // [{first_name,last_name}]
const [selected, setSelected] = useState({});          // {"First Last": true|false}
const [showFamily, setShowFamily] = useState(false);

// count how many checked (used to keep your form guests count via hidden input)
const selectedCount = useMemo(
  () => Object.values(selected).filter(Boolean).length,
  [selected]
);

// Read current First/Last from the form and trigger lookup once both have values
function syncGroupFromForm(form) {
  const first = form?.firstName?.value?.trim() || "";
  const last  = form?.lastName?.value?.trim()  || "";
  if (first && last) handleNameChange(first, last);
}

// 1) Find guest -> get their group_ID
// 2) Load ONLY members with SAME group_ID
// 3) Pre-check members already RSVP'd attending=true
async function handleNameChange(first, last) {
  const { data: me, error: e1 } = await supabase
    .from("guests")
    .select('first_name,last_name,group_ID') 
    .ilike("first_name", first)   // case-insensitive match
    .ilike("last_name", last)
    .maybeSingle();

  if (e1 || !me?.group_ID) { setShowFamily(false); return; }

const gid = me.group_ID;                       // <-- group_ID
  setGroupId(gid);

  const { data: fam, error: e2 } = await supabase
    .from("guests")
    .select("first_name,last_name")
    .eq('group_ID', gid)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (e2) { setShowFamily(false); return; }

  const { data: rs } = await supabase
    .from("rsvps")
    .select("first_name,last_name,attending")
    .eq('group_ID', gid);

  const attendingSet = new Set(
    (rs || [])
      .filter(r => r.attending === true)
      .map(r => `${r.first_name} ${r.last_name}`.toLowerCase())
  );

  // pre-check self + already-attending family
  const initial = Object.fromEntries(
    (fam || []).map(p => {
      const full = `${p.first_name} ${p.last_name}`;
      const isSelf =
        p.first_name.toLowerCase() === first.toLowerCase() &&
        p.last_name.toLowerCase() === last.toLowerCase();
      return [full, isSelf || attendingSet.has(full.toLowerCase())];
    })
  );

  setFamily(fam || []);
  setSelected(initial);
  setShowFamily(true);
}

function toggleMember(fullName) {
  setSelected(prev => ({ ...prev, [fullName]: !prev[fullName] }));
}



async function verifyGuestOnList(first, last) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!f || !l) return null;

  const { data, error } = await supabase
    .from('guests')
    .select('first_name, last_name, group_ID')
    .ilike('first_name', f)   // case-insensitive
    .ilike('last_name', l)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

// Save SAME-group selections into rsvps, then (optionally) trigger your email route
async function handleSubmitFamilyRSVP() {
  if (!groupId || !family.length) {
    throw new Error('No family/group loaded yet. Type your first + last name, then click outside the field.');
  }

  const rows = family.map(p => {
    const full = `${p.first_name} ${p.last_name}`;
    const isAttending = !!selected[full];
    return {
      first_name: p.first_name,
      last_name:  p.last_name,
      group_ID:   groupId,            // ← SAME group enforced
      attending:  !!selected[full],
      guests:     isAttending ? 1 : 0, // optional: headcount
    };
  });

  console.log('Upserting rows →', rows);

  try {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(rows, {
        onConflict: 'first_name,last_name,group_ID', // MUST match a UNIQUE constraint
        returning: 'minimal',
      });

    if (error) throw error;

    // optional: fire your notify email fetch here
    // await fetch('/api/rsvp/notify', { ... });

    alert('Thanks! Your RSVP has been saved.');
  } catch (err) {
    console.error('RSVP upsert error:', err); // <- open devtools console to read
    alert(`Failed to save family RSVP: ${err.message || err}`);
  }

  // upsert by first_name,last_name,group_ID
  const { error } = await supabase.from('rsvps').upsert(rows, {
    onConflict: 'first_name,last_name,group_ID', // <-- group_ID
    returning: 'minimal',
  });

  if (error) {
    console.error(error);
    alert('Failed to save family RSVP');
  }
}




async function handleSubmitAll(e) {
  e.preventDefault();                 // stop native submit
   if (!groupId || !family.length) {
    alert('Please enter your first & last name, then pick your family.');
    return;
  }
  setSubmitting(true);
  try {
    // 1) block if the group is already locked (see section 2)
    const { data: lock } = await supabase
      .from('group_locks')
      .select('*')
      .eq('group_ID', groupId)
      .maybeSingle();
    if (lock) {
      // already submitted before — just route to thank you
      router.replace('/thank-you');
      return;
    }

    await handleSubmitFamilyRSVP();

    await supabase.from('group_locks').insert({ group_ID: groupId }).select().single();

    // 4) go to thank-you
    router.replace('/thank-you');   // use replace so back button doesn’t resubmit
  } catch (err) {
    console.error('Submit error:', err);
    alert(err?.message || 'Failed to save RSVP');
  } finally {
    setSubmitting(false);
  }

}

  

  
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false); // ⬅️ add this

  useEffect(() => {
  const handleKey = (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "a") {
  window.location.href = "/admin/login";
}

  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, []);


  // RSVP form handler
  async function handleRsvpSubmit(e) {
  e.preventDefault();
  setSubmitting(true);

  try {
    const fd = new FormData(e.currentTarget);

    const payload = {
      firstName:  String(fd.get("firstName") || ""),
      lastName:   String(fd.get("lastName") || ""),
      email:      String(fd.get("email") || ""),
      phone:      String(fd.get("phone") || ""),
      attending:  String(fd.get("attending") || "yes") === "yes",
      guests:     Number(fd.get("guests") || 1),
      diet:       String(fd.get("diet") || ""),
      message:    String(fd.get("message") || ""),
    };

    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      alert(`RSVP failed: ${json.error || res.statusText}`);
      return;
    }

    // success → go to thank-you page
    const first = encodeURIComponent(payload.firstName);
    const last  = encodeURIComponent(payload.lastName);
    window.location.href = `/thank-you?firstName=${first}&lastName=${last}`;
  } catch (err) {
    console.error(err);
    alert(err.message || "Sorry, something went wrong.");
  } finally {
    setSubmitting(false);
  }
}

  
  return (
    <main className="bg-[#c3c7b3]">

      <header className="fixed inset-x-0 top-0 z-50">
      {/* Top name bar (transparent) */}
      <div
  className={`${scrolled ? 'bg-[#c3c7b3]/95 shadow-sm' : 'bg-[#c3c7b3]/90'} backdrop-blur transition-colors`}
>
  <div className="max-w-6xl mx-auto px-6 py-4">
    <h1 className="script-title text-3xl md:text-4xl text-[#3e3a37] text-center">
  John & Kristen
</h1>

  </div>
  <div className="border-b border-transparent" />
</div>

      {/* Slim nav strip (fully transparent) */}
      <nav className="bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <ul className="flex items-center justify-center gap-6 md:gap-10 text-sm uppercase tracking-[0.25em] text-[#000000]">
            <li><a href="#home" className="inline-block py-3 hover:opacity-70">Home</a></li>
            <li><a href="#about" className="inline-block py-3 hover:opacity-70">About</a></li>
            <li><a href="#rsvp" className="inline-block py-3 hover:opacity-70">RSVP</a></li>
            <li><a href="#timeline" className="inline-block py-3 hover:opacity-70">Timeline</a></li>
            <li><a href="#wedding" className="inline-block py-3 hover:opacity-70">Wedding</a></li>
            <li><a href="#contact" className="inline-block py-3 hover:opacity-70">Contacts</a></li>
          </ul>
        </div>
      </nav>
    </header>
      
      <FadeInSection>
        <section
        id="home"
        className="relative w-full h-screen flex items-center justify-center pt-16 md:pt-24">

      <Image
          src="/about20.jpeg"
          alt="Couple"
          fill
          className="object-cover brightness-75"
          priority
        />
        
      {/* sticky header over the page (transparent) */}
    


        <div className="relative z-10 text-center mt-12 md:mt-20">
  <h1 className="text-7xl md:text-9xl font-serif tracking-wide text-white leading-tight mb-1 md:mb-2">
  John & Kristen
</h1>

          <p
  className="script-title text-white italic [text-shadow:_0_2px_6px_rgba(0,0,0,.35)] leading-snug mt-0 md:mt-1"
  style={{ fontSize: "clamp(1.6rem, 2.6vw + 1rem, 3.1rem)" }}
>
  are getting married!
</p>
          <p className="mt-2 text-lg tracking-widest  text-white">APRIL 25, 2026</p>
        </div>
      </section>
      
      </FadeInSection>

      <Countdown />

      {/* Love Story */}
      <FadeInSection>
        
        <section
        id="about"
        className="max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-12 scroll-mt-24"
      >
        {/* Text */}
        <div className="md:w-1/2">
          <h2 className="text-4xl font-great-vibes mb-6">This is our love story</h2>

          <p className="leading-relaxed text-black mb-4">
            If you ask John, he’ll say he saw Kristen first. But technically,
            Kristen spotted him before he ever knew it. Months before they officially met,
            a friend had wanted to introduce Kristen to another John De Leon. Out of curiosity,
            she searched him up on social media — only to stumble upon a different profile:
            John Gabriel De Leon, the man who would one day become her husband.
          </p>

          <p className="leading-relaxed text-black mb-4">
            Months later, their paths finally crossed when both were invited by a mutual friend
            to SFC’s Christian Life Program. During a fellowship after one of the events,
            John chose a seat across from Kristen, and even though the table was full,
            their attention never drifted far from each other. They quickly realized how much
            they had in common — both being the eldest in their families, volunteering at the same place,
            and sharing a strong desire to grow deeper in their faith.
          </p>

          <p className="leading-relaxed text-black">
            Not long after, John invited Kristen out for coffee — though in truth, he wanted more time together,
            so their first official date ended up being at Kinjo. The date went well, to say the least.
            What started as one meal has turned into countless more, and soon, a lifetime of them together.
          </p>
        </div>

        {/* Image */}
        <div className="md:w-1/2 rounded-2xl overflow-hidden">
          <Image
            src="/about1.jpeg"
            alt="Couple photo"
            width={600}
            height={400}
            className="object-cover"
            priority
          />
        </div>
      </section>
      </FadeInSection>

      {/* Love Story — Row 2 (alternate layout) */}
<FadeInSection>
  <section id="engagement" className="bg-[#f6f2ee] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-10 md:gap-14 md:grid-cols-5 items-start">
          
          {/* Left column: copy + small image */}
          <div className="md:col-span-3">
            <p className="tracking-[0.28em] text-[11px] md:text-xs uppercase text-[#8a7566]">
              Our Engagement
            </p>
            <h2 className="mt-2 text-3xl md:text-4xl font-serif text-[#3e3a37]">
              Love at first sunset
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-[#4a4643]">
              We got engaged on the Platform, with the city skyline behind us and the sun setting.
              I’d told Kristen we were just stopping to take a quick photo, but waiting nearby were
              the people who built us: both of our parents and our siblings. When she turned back to me,
              I took her hands, told her how every little ordinary day with her has felt like the best one,
              and asked if we could make a lifetime of them. She said “yes” (twice), and our families rushed
              in for hugs. The memory is everything we hoped for, with both of our families there to bless
              the beginning of the rest of our life together.
            </p>

            {/* supporting image */}
            <div className="mt-6">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-black/5 bg-white">
                <Image
                  src="/about3.jpeg"
                  alt="Rings / details"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right column: hero photo with decorative stamp */}
          <div className="md:col-span-2 relative">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-black/5 bg-white shadow-lg">
              <Image
                src="/about04.png"
                alt="Our engagement"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
            </div>

            {/* faint circular “stamp” */}
            <svg
              viewBox="0 0 200 200"
              className="hidden md:block absolute -bottom-10 -left-8 w-40 h-40 text-[#b9aaa0]/50"
            >
              <defs>
                <path id="circlePath" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0" />
              </defs>
              <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeDasharray="2 6" strokeWidth="2" />
              <text fill="currentColor" fontSize="10" letterSpacing="3">
                <textPath href="#circlePath">JOHN & KRISTEN • 04 · 25 · 2026 • CANMORE •</textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
</FadeInSection>


      <FadeInSection>

       <section id="rsvp" className="bg-[#d1b8c] text-[#3e3a37]">
      {/* Photo header */}
      <div className="relative w-full h-[40vh] min-h-[320px]">
        <Image
          src="/pic.png"
          alt="John & Kristen"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-6xl font-serif tracking-wide text-white">
            John and Kristen
          </h1>
          <p className="mt-3 text-xl md:text-2xl text-white/90 font-great-vibes italic">
            are getting married
          </p>
          <p className="mt-2 text-sm md:text-base tracking-[0.35em] text-white/90">
            APRIL 25, 2026 • CANMORE, ALBERTA
          </p>
        </div>
      </div>

      {/* Copy + Form */}
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        {/* Headings */}
        <div className="text-center mb-10 md:mb-14">
          <p className="font-great-vibes text-2xl md:text-3xl text-[#806a5a]">
            we invite you to
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-serif tracking-normal">
  Celebrate Our Wedding
</h2>

          <p className="mt-4 text-xs md:text-sm text-[#6b5a4e] tracking-wide">
            Please confirm your presence through the RSVP form by <strong>07.15.2025</strong>.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 md:p-10">
<form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmitAll}>
  {/* Name entry note */}
  <div className="md:col-span-2 mb-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
    <p>
      Please enter <b>only your first and last name</b>. Don’t include middle names.
    </p>
    <p className="mt-1">
      Example: <span className="font-medium">First name:</span> “Jasmine”; <span className="font-medium">Last name:</span> “De&nbsp;Leon”.
    </p>
  </div>

  {/* First / Last */}
  <div className="flex flex-col">
    <label htmlFor="firstName" className="text-xs uppercase tracking-widest mb-2">
      First name
    </label>
    <input
      id="firstName"
      name="firstName"
      type="text"
      required
      pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+$"
      title="First name only (no middle names)."
      className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
      placeholder="e.g., Jasmine"
      onBlur={(e) => {
        e.currentTarget.value = e.currentTarget.value.trim().replace(/\s+/g, '');
        syncGroupFromForm(e.currentTarget.form);
      }}
    />
  </div>

  <div className="flex flex-col">
    <label htmlFor="lastName" className="text-xs uppercase tracking-widest mb-2">
      Last name
    </label>
    <input
      id="lastName"
      name="lastName"
      type="text"
      required
      pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'’ -]+$"
      title="Last name only (e.g., De Leon)."
      className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
      placeholder="e.g., De Leon"
      onBlur={(e) => {
        e.currentTarget.value = e.currentTarget.value.trim().replace(/\s{2,}/g, ' ');
        syncGroupFromForm(e.currentTarget.form);
      }}
    />
  </div>

            {/* Email / Phone */}
            <div className="flex flex-col">
              <label htmlFor="email" className="text-xs uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="phone" className="text-xs uppercase tracking-widest mb-2">
                Phone (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
                placeholder="(xxx) xxx-xxxx"
              />
            </div>

            {/* Attendance (radios) */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-xs uppercase tracking-widest mb-2">Will you attend?</span>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="attending" value="yes" defaultChecked className="accent-[#c8b6a6]" />
                  <span>Yes, can’t wait!</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="attending" value="no" className="accent-[#c8b6a6]" />
                  <span>Sorry, can’t make it</span>
                </label>
              </div>
            </div>

            {/* FAMILY (replaces number of guests) */}
            {showFamily && family.length > 0 && (
              <div className="md:col-span-2">
                <div className="rounded-xl border border-[#d8cfc6] bg-white/90 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold tracking-wide text-[#3e3a37]">
                      Select who from your family is attending
                    </h3>
                    <span className="text-xs text-[#6b5a4e]">Group: <b>{groupId}</b></span>
                  </div>

                  <div className="divide-y divide-[#eee4da]">
                    {family.map((p, i) => {
                      const full = `${p.first_name} ${p.last_name}`;
                      return (
                        <label
                          key={`${full}-${i}`}
                          className="flex items-center justify-between py-2 px-2 hover:bg-[#f7f2ee] rounded-lg"
                        >
                          <span className="capitalize">{full}</span>
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-[#c8b6a6]"
                            checked={!!selected[full]}
                            onChange={() => toggleMember(full)}
                          />
                        </label>
                      );
                    })}
                  </div>

                  {/* keep legacy consumers happy if they expect `guests` */}
                  <input type="hidden" name="guests" value={selectedCount} />
                  <p className="mt-3 text-[11px] text-[#6b5a4e]">
                    (Check everyone who’s coming — including yourself.)
                  </p>
                </div>
              </div>
            )}

            {/* Dietary */}
            <div className="flex flex-col">
              <label htmlFor="diet" className="text-xs uppercase tracking-widest mb-2">
                Dietary restrictions (optional)
              </label>
              <input
                id="diet"
                name="diet"
                type="text"
                className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
                placeholder="Allergies, vegetarian, etc."
              />
            </div>

            {/* Message */}
            <div className="flex flex-col md:col-span-2">
              <label htmlFor="message" className="text-xs uppercase tracking-widest mb-2">
                Anything else? Who is coming?
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
                placeholder="Extra guests name, etc.."
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-center pt-2">
              <button type="submit" disabled={submitting}> 
  {submitting ? 'Submitting…' : 'Submit RSVP'}
</button>
            </div>
          </form>
        </div>

        {/* small note */}
        <p className="mt-6 text-center text-xs text-[#6b5a4e]">
          If plans change after submitting, please reach out so we can update seating & meals.
        </p>
      </div>
    </section>

      </FadeInSection>

    

    <FadeInSection>
      {/* TIMELINE */}
<section id="timeline" className="max-w-5xl mx-auto px-6 py-16 md:py-20">
  <div className="text-center mb-10 md:mb-14">
    <h2 className="mt-2 text-3xl md:text-4xl font-serif tracking-normal">
      Order of Events
    </h2>
  </div>

  {/* Important dates */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
    <div className="bg-white/90 rounded-2xl shadow p-6 text-center">
      <div className="text-2xl md:text-3xl font-great-vibes text-[#806a5a]">
        February 25, 2026
      </div>
      <div className="mt-2 text-sm md:text-base text-[#3e3a37]">
        RSVP Closes
      </div>
    </div>
    <div className="bg-white/90 rounded-2xl shadow p-6 text-center">
      <div className="text-2xl md:text-3xl font-great-vibes text-[#806a5a]">
        April 25, 2026
      </div>
      <div className="mt-2 text-sm md:text-base text-[#3e3a37]">
        John and Kristen Get Married!
      </div>
    </div>
  </div>

  {/* Timeline list (UI unchanged, just new content) */}
  <ul className="space-y-4">
    {[
      {
        time: '12:30 PM',
        title: 'Guests and Bridal Party Arrive',
        note: 'at the Shrine Church',
      },
      {
        time: '1:00 PM',
        title: 'Church Ceremony Commences',
        note: 'at the Shrine Church',
      },
      {
        time: '2:00 PM',
        title: 'Pictures With Guests and Bridal Party',
        note: 'at the Shrine Church',
      },
      {
        time: '5:00 PM',
        title: 'Cocktail Hour Commences',
        note: 'at the Malcolm Hotel',
      },
      {
        time: '6:00 PM',
        title: 'Dinner and Reception Commences',
        note: 'at the Malcolm Hotel',
      },
    ].map((e, i) => (
      <li
        key={i}
        className="bg-white/90 rounded-2xl shadow p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div className="md:w-32 shrink-0 text-[#806a5a] font-semibold tracking-wide">
          {e.time}
        </div>
        <div className="mt-2 md:mt-0 md:flex-1 md:px-6">
          <div className="font-medium text-[#3e3a37]">{e.title}</div>
          <div className="text-sm text-[#6b5a4e]">{e.note}</div>
        </div>
      </li>
    ))}
  </ul>
</section>

    </FadeInSection>

    <FadeInSection>
      {/* DETAILS */}

      <section id="wedding" className="max-w-6xl mx-auto px-6 py-24 space-y-16">
  <h2 className="text-center text-4xl font-great-vibes mb-2">The details</h2>
  <p className="text-center text-sm tracking-widest mb-8">
    Ceremony & Reception locations with photos and maps
  </p>

  {/* CEREMONY — The Shrine Church of Our Lady of the Rockies */}
  <div className="flex flex-col md:flex-row items-center gap-10">
    {/* Photo */}
    <div className="md:w-1/2 rounded-2xl overflow-hidden">
      <Image
        src="/church.jpeg"
        alt="The Shrine Church of Our Lady of the Rockies"
        width={800}
        height={500}
        className="object-cover w-full h-auto"
        priority
      />
    </div>
    {/* Text + Map */}
    <div className="md:w-1/2 w-full">
      <h3 className="font-serif text-2xl mb-2">Ceremony</h3>
      <p className="font-great-vibes text-3xl mb-2">The Shrine Church of Our Lady of the Rockies</p>
      <p className="text-sm opacity-80 mb-4">51.0893° N, 115.3485° W — Canmore, AB</p>
      <div className="rounded-2xl overflow-hidden w-full h-[260px]">
        <iframe
          title="Our Lady of the Rockies Catholic Church Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2505.769319748087!2d-115.3454843!3d51.094264599999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5370c5ebb3873ec1%3A0x2823d0f2f20cf33!2sThe%20Shrine%20Church%20of%20Our%20Lady%20of%20the%20Rockies!5e0!3m2!1sen!2sca!4v1759017803233!5m2!1sen!2sca"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  </div>

  {/* RECEPTION — The Malcolm Hotel, Canmore */}
  <div className="flex flex-col md:flex-row-reverse items-center gap-10">
    {/* Photo */}
    <div className="md:w-1/2 rounded-2xl overflow-hidden">
      <Image
        src="/hotel.jpeg"
        alt="The Malcolm Hotel, Canmore"
        width={800}
        height={500}
        className="object-cover w-full h-auto"
      />
    </div>
    {/* Text + Map */}
    <div className="md:w-1/2 w-full">
      <h3 className="font-serif text-2xl mb-2">Reception</h3>
      <p className="font-great-vibes text-3xl mb-2">The Malcolm Hotel, Canmore</p>
      <p className="text-sm opacity-80 mb-4">51.0893° N, 115.3522° W — Canmore, AB</p>
      <div className="rounded-2xl overflow-hidden w-full h-[260px]">
        <iframe
          title="The Malcolm Hotel Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2506.1741711589752!2d-115.3527281!3d51.086793099999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5370c5bfeb7f6009%3A0xa1e3d6e2667e256d!2sThe%20Malcolm%20Hotel!5e0!3m2!1sen!2sca!4v1759017948131!5m2!1sen!2sca"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  </div>
</section>
    </FadeInSection>

    <FadeInSection>
      <section id="accommodations" className="bg-[#f4f5ee] py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-6">
        <div className="relative bg-[#d1b8c]/95 rounded-2xl shadow-xl ring-1 ring-black/5 px-6 py-10 md:px-10 md:py-12 text-center">

          {/* heading */}
          <h className="font-great-vibes text-5xl md:text-6xl text-[#3e3a37] leading-none">Hotels</h>

          {/* subtle divider */}
          <div className="mx-auto my-6 h-px w-24 bg-[#e8dee8]" />

          {/* • ACCOMMODATIONS • */}
          <p className="tracking-[0.25em] text-[11px] md:text-xs text-[#6b5a4e] uppercase mb-6">
            • Accommodations •
          </p>

          {/* Coast Hotel */}
          <div className="space-y-1.5 text-[#3e3a37]">
            <p className="font-semibold">Coast Hotel</p>
            <p className="text-sm"><span className="font-medium">Discount code:</span> WED</p>
            <p className="text-sm">
              <span className="font-medium">Hotel number:</span>{' '}
              <a href="tel:18007166199" className="underline decoration-dotted hover:opacity-80">
                1.800.716.6199
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">Website:</span>{' '}
              <a href="http://coa.st/610t" className="underline decoration-dotted hover:opacity-80" target="_blank" rel="noreferrer">
                coa.st/610t
              </a>
            </p>
            <p className="text-xs text-[#6b5a4e] mt-2">
              Reservations are subject to availability and rates may fluctuate. A valid credit card is required; the first night’s room &amp; tax is prepaid and non-refundable at booking.
            </p>
          </div>

          {/* subtle dot */}
          <div className="my-8 text-[#c3b6ab]">• • •</div>

          {/* Malcolm Hotel */}
          <div className="space-y-1.5 text-[#3e3a37]">
            <p className="font-semibold">Malcolm Hotel</p>
            <p className="text-sm"><span className="font-medium">Discount code:</span> 2604DELE</p>
            <p className="text-sm">
              <span className="font-medium">Hotel number:</span>{' '}
              <a href="tel:4038120680" className="underline decoration-dotted hover:opacity-80">
                403.812.0680
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">Website:</span>{' '}
              <a href="https://malcolmhotel.ca" className="underline decoration-dotted hover:opacity-80" target="_blank" rel="noreferrer">
                malcolmhotel.ca
              </a>
            </p>
            <p className="text-xs text-[#6b5a4e] mt-2">
              Booking code provides <span className="font-medium">20% off</span> the best flexible rate.
              A two-night minimum may apply on certain dates.
            </p>
          </div>

          {/* subtle dot */}
          <div className="my-8 text-[#c3b6ab]">• • •</div>

          {/* Everwild Canmore */}
          <div className="space-y-1.5 text-[#3e3a37]">
            <p className="font-semibold">Everwild Canmore</p>
            <p className="text-sm">
              <span className="font-medium">Promo code:</span> HAPPYEVERAFTER (25% off online reservations)
            </p>
            <p className="text-sm">
              <span className="font-medium">Reservations:</span>{' '}
              <a href="https://stayeverwild.com/canmore/" className="underline decoration-dotted hover:opacity-80" target="_blank" rel="noreferrer">
                stayeverwild.com/canmore
              </a>
            </p>
          </div>

          {/* bottom spacing */}
          <div className="mt-8" />

          {/* optional fine print / link to more */}
          {/* <p className="text-xs text-[#6b5a4e]">
            For more details and updates, visit <a href="https://johnandkristen.ca" className="underline decoration-dotted">johnandkristen.ca</a>
          </p> */}
        </div>
      </div>
    </section>
    </FadeInSection>

      <FadeInSection>
      <section id="attire" className="bg-[#e8e4d5] py-16 md:py-24">
  <div className="max-w-6xl mx-auto px-6">
    {/* Heading */}
    <div className="text-center">
      <p className="tracking-[0.28em] text-[11px] md:text-xs uppercase text-[#8a7566]">Formal</p>
      <h2 className="font-great-vibes text-4xl md:text-5xl text-[#3e3a37] leading-tight">Attire</h2>
    </div>

    {/* Layout: Gentlemen (left) • Lineup (center) • Ladies (right) */}
    <div className="mt-10 grid gap-8 md:gap-12 md:grid-cols-3 items-center text-[#3e3a37]">
      {/* Gentlemen */}
      <div className="text-center md:text-right">
        <h3 className="text-lg font-semibold tracking-wide">Gentlemen</h3>
        <p className="mt-1 text-sm text-[#6b5a4e]">Suit</p>
      </div>

      {/* Lineup image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl aspect-[26/13]">
          <Image
            src="/attire_transparents.png"
            alt="Guest attire lineup"
            fill
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
      </div>

      {/* Ladies */}
      <div className="text-center md:text-left">
        <h3 className="text-lg font-semibold tracking-wide">Ladies</h3>
        <p className="mt-1 text-sm text-[#6b5a4e]">Long gowns and dresses</p>
      </div>
    </div>

    {/* Palette */}
    <div className="mt-10 text-center">
      <p className="tracking-[0.25em] text-[11px] md:text-xs uppercase text-[#8a7566]">Palette</p>

      {/* 5 swatches, perfectly centered; nudge slightly right on md+ */}
      <div className="mt-4 mx-auto w-full md:w-fit md:translate-x-4">
        <div className="grid grid-cols-5 gap-6 place-items-center">
          {[
            { src: '/green.png',  label: 'Sage Green' },
            { src: '/yellow.png', label: 'Soft Yellow' },
            { src: '/purple.png', label: 'Lavender' },
            { src: '/beige.png',  label: 'Neutral Beige' },
            { src: '/brown.png',  label: 'Warm Brown' },
          ].map((c) => (
            <div key={c.label} className="text-center">
              <div className="relative h-12 w-12 overflow-hidden rounded-full ring-1 ring-black/10">
                <Image src={c.src} alt={c.label} fill className="object-cover" />
              </div>
              <span className="mt-2 block text-xs text-[#3e3a37]">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note under palette */}
      <div className="max-w-3xl mx-auto mt-8 space-y-3 text-sm md:text-base text-[#3e3a37] text-center">
        <h3 className="font-semibold">Guests’ Attire</h3>
        <p><strong>Formal.</strong> We kindly invite our guests to dress in their finest.</p>
        <p>
          <strong>Gentlemen</strong> may choose a suit or dress shirt with dress pants —
          jackets and ties are optional.
        </p>
        <p>
          <strong>Ladies</strong> are encouraged to wear floor-length gowns or jumpsuits —
          satin, chiffon, tulle, ruffles, and floral prints with the assigned colours are welcome!
        </p>
      </div>
    </div>
  </div>
</section>
    </FadeInSection>

      
    

      <FadeInSection>
      <section id="contact" className="bg-[#c3cdbe] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-10 md:gap-14 md:grid-cols-3 items-center text-[#3e3a37]">
          {/* Left: John */}
          <div className="text-center md:text-right space-y-2">
            <p className="tracking-[0.25em] text-[11px] md:text-xs uppercase text-[#8a7566]">
              Contact
            </p>
            <h3 className="text-2xl font-serif">John</h3>
            <p className="text-sm">
              <span className="font-medium">Number: </span>
              <a href="tel:15878996309" className="underline decoration-dotted hover:opacity-80">
                587&nbsp;899&nbsp;6309
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">Email: </span>
              <a
                href="mailto:johnandkristen.deleon@gmail.com"
                className="underline decoration-dotted hover:opacity-80 break-all"
              >
                johnandkristen.deleon@gmail.com
              </a>
            </p>
          </div>

          {/* Center: circular image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image
                src="/LOL.jpg"
                alt="John & Kristen"
                fill
                className="rounded-full object-cover ring-4 ring-[#d8cfc6] shadow-xl"
                priority
              />
            </div>
          </div>

          {/* Right: Kristen */}
          <div className="text-center md:text-left space-y-2">
            <p className="tracking-[0.25em] text-[11px] md:text-xs uppercase text-transparent select-none">
              Contact
            </p>
            <h3 className="text-2xl font-serif">Kristen</h3>
            <p className="text-sm">
              <span className="font-medium">Number: </span>
              <a href="tel:14036136976" className="underline decoration-dotted hover:opacity-80">
                403&nbsp;613&nbsp;6976
              </a>
            </p>
            <p className="text-sm">
              <span className="font-medium">Email: </span>
              <a
                href="mailto:johnandkristen.deleon@gmail.com"
                className="underline decoration-dotted hover:opacity-80 break-all"
              >
                johnandkristen.deleon@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
      </FadeInSection>
    </main>
  );
}
