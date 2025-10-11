"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FadeInSection from "../components/FadeInSection";
import Countdown from "../components/Countdown";
import { supabase } from "../lib/supabase";


export default function Home() {
  const router = useRouter();

  // Sticky header style
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Family/RSVP state
  const [groupId, setGroupId] = useState("");
  const [family, setFamily] = useState([]); // [{first_name,last_name}]
  const [selected, setSelected] = useState({}); // {"First Last": true|false}
  const [showFamily, setShowFamily] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // keyboard shortcut to admin
  useEffect(() => {
    const handleKey = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "a") {
        window.location.href = "/admin/login";
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // count checked family
  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  function toggleMember(fullName) {
    setSelected((prev) => ({ ...prev, [fullName]: !prev[fullName] }));
  }

  // Read current First/Last from the form and trigger lookup once both have values
  function syncGroupFromForm(form) {
    const first = form?.firstName?.value?.trim() || "";
    const last = form?.lastName?.value?.trim() || "";
    if (first && last) handleNameChange(first, last);
  }

  // 1) Find guest -> group_ID
  // 2) Load ONLY members with SAME group_ID
  // 3) Pre-check members already RSVP'd attending=true
  async function handleNameChange(first, last) {
    const { data: me, error: e1 } = await supabase
      .from("guests")
      .select("first_name,last_name,group_ID")
      .ilike("first_name", first)
      .ilike("last_name", last)
      .maybeSingle();

    if (e1 || !me?.group_ID) {
      setShowFamily(false);
      setGroupId("");
      setFamily([]);
      setSelected({});
      return;
    }

    const gid = me.group_ID;
    setGroupId(gid);

    const { data: fam, error: e2 } = await supabase
      .from("guests")
      .select("first_name,last_name")
      .eq("group_ID", gid)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (e2) {
      setShowFamily(false);
      return;
    }

    const { data: rs } = await supabase
      .from("rsvps")
      .select("first_name,last_name,attending")
      .eq("group_ID", gid);

    const attendingSet = new Set(
      (rs || [])
        .filter((r) => r.attending === true)
        .map((r) => `${r.first_name} ${r.last_name}`.toLowerCase())
    );

    const initial = Object.fromEntries(
      (fam || []).map((p) => {
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

  // Save SAME-group selections into rsvps
  async function upsertFamilySelections() {
    if (!groupId || !family.length) {
      throw new Error(
        "No family/group loaded yet. Type your first + last name, then click outside the field."
      );
    }
    const rows = family.map((p) => {
      const full = `${p.first_name} ${p.last_name}`;
      const isAttending = !!selected[full];
      return {
        first_name: p.first_name,
        last_name: p.last_name,
        group_ID: groupId,
        attending: isAttending,
        guests: isAttending ? 1 : 0,
      };
    });

   const { error: lockErr } = await supabase
  .from('group_locks')
  .insert({ group_ID: groupId });
if (lockErr) console.warn('group_locks insert error:', lockErr);

  }

  // helper used below (keep it if you show the family grid)
async function upsertFamilySelections() {
  if (!family.length || !groupId) return;

  const rows = family.map((p) => {
    const full = `${p.first_name} ${p.last_name}`;
    return {
      first_name: p.first_name,
      last_name:  p.last_name,
      group_ID:   groupId,
      attending:  !!selected[full],
      guests:     selected[full] ? 1 : 0,
    };
  });

  const { error } = await supabase
    .from("rsvps")
    .upsert(rows, { onConflict: "first_name,last_name,group_ID", returning: "minimal" });

  if (error) throw error;
}

// MAIN submit handler — exactly one function, not nested
const handleRsvpSubmit = async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  if (!(form instanceof HTMLFormElement)) {
    alert("Form element not found.");
    return;
  }

  setSubmitting(true);
  try {
    // Optional: block if group already locked
    if (groupId) {
      const { data: lockRow, error: lockErr } = await supabase
  .from('group_locks')
  .insert({ group_ID: groupId })
  .select()
  .single();  // ✅ no .catch()

if (lockErr) {
  // handle or ignore specific errors (e.g., duplicate insert)
  console.warn('group_locks insert error:', lockErr);
}

    }

    const fd = new FormData(form);
    const payload = {
      firstName: String(fd.get("firstName") || ""),
      lastName:  String(fd.get("lastName") || ""),
      email:     String(fd.get("email") || ""),
      phone:     String(fd.get("phone") || ""),
      attending: String(fd.get("attending") || "yes") === "yes",
      guests:    Number(fd.get("guests") || selectedCount || 1),
      diet:      String(fd.get("diet") || ""),
      message:   String(fd.get("message") || ""),
      groupId,
      selectedList: Object.keys(selected).filter((k) => !!selected[k]),
    };

    // Call your API (sends emails + inserts single row)
    const res  = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) console.warn("RSVP API error:", json?.error || res.statusText);

    // Save family selections (if you show that grid)
    await upsertFamilySelections();

    // Optionally mark the whole group as locked
    if (groupId) {
      await supabase
        .from("group_locks")
        .insert({ group_ID: groupId })
        .select()
        .single()
      
    }

    // Redirect
    router.replace(
      `/thank-you?firstName=${encodeURIComponent(payload.firstName)}&lastName=${encodeURIComponent(payload.lastName)}`
    );
  } catch (err) {
    console.error("Submit error:", err);
    alert(err?.message || "Failed to submit RSVP");
  } finally {
    setSubmitting(false);
  }
};


  
  return (
    <main className="bg-[#c3c7b3]">

     <header className="fixed inset-x-0 top-0 z-50">
  {/* Slim nav strip */}
  <nav className="bg-[#c3c7b3]">
    <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6">
      <ul
        className="
          flex flex-wrap items-center justify-center
          gap-2 sm:gap-4 md:gap-8
          text-[10px] sm:text-xs md:text-sm
          leading-none uppercase
          tracking-[0.06em] sm:tracking-[0.14em] md:tracking-[0.18em]
          text-[#000000]
        "
      >
          <li><a href="#home"     className="inline-block py-2 md:py-3 hover:opacity-70">Home</a></li>
          <li><a href="#about"    className="inline-block py-2 md:py-3 hover:opacity-70">About</a></li>
          <li><a href="#gallery"    className="inline-block py-2 md:py-3 hover:opacity-70">Gallery</a></li>
          <li><a href="#timeline" className="inline-block py-2 md:py-3 hover:opacity-70">Timeline</a></li>
          <li><a href="#wedding"  className="inline-block py-2 md:py-3 hover:opacity-70">Wedding</a></li>
          <li><a href="#rsvp"     className="inline-block py-2 md:py-3 hover:opacity-70">RSVP</a></li>
          <li><a href="#contact"  className="inline-block py-2 md:py-3 hover:opacity-70">Contacts</a></li>
        </ul>
      </div>
    </nav>
  </header>

  <FadeInSection>
    <section
      id="home"
      /* shorter top-padding on phones since the header is smaller */
      className="relative w-full h-[100svh] pt-12 sm:pt-14 md:pt-24"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src="/about3.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* HERO TEXT */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2 z-10
          top-[18vh] sm:top-[20vh] md:top-[24vh] lg:top-[26vh]
          w-[min(92vw,1000px)] px-4 text-center
        "
      >
        <h1
          className="font-great-vibes drop-shadow-md leading-tight"
          style={{ color: '#777f59', fontSize: 'clamp(2.4rem, 7.2vw, 6rem)' }}
        >
          John & Kristen
        </h1>

        <p
          className="mt-2 font-spectral italic [text-shadow:_0_2px_6px_rgba(0,0,0,.35)]"
          style={{ color: '#777f59', fontSize: 'clamp(1rem, 2.2vw, 1.8rem)' }}
        >
          are getting married!
        </p>

        <p
          className="mt-3 tracking-[0.26em] sm:tracking-[0.3em] md:tracking-[0.32em] text-[0.65rem] sm:text-[0.72rem] md:text-sm"
          style={{ color: '#777f59' }}
        >
          APRIL 25, 2026
        </p>
      </div>
    </section>
</FadeInSection>


      <Countdown />

   {/* Love Story */}
<FadeInSection>
  <section id="about" className="bg-[#ccd2bf]">
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Heading */}
      <h2 className="font-great-vibes text-4xl md:text-5xl mb-6 md:mb-8">
        This is our love story
      </h2>

      {/* Grid (row 1): copy left, image right */}
      <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-start">
        {/* Left copy */}
        <div className="md:col-span-6 space-y-5 leading-7 text-[#2f2d2b]">
          <p>
            If you ask John, he’ll say he saw Kristen first. But technically, Kristen
            spotted him before he ever knew it. Months before they officially met, a
            friend had wanted to introduce Kristen to another John De Leon. Out of
            curiosity, she searched him up on social media — only to stumble upon a
            different profile: John Gabriel De Leon, the man who would one day become
            her husband.
          </p>
          <p>
            Months later, their paths finally crossed when both were invited by a
            mutual friend to SFC’s Christian Life Program. During a fellowship after
            one of the events, John chose a seat across from Kristen; even though the
            table was full, their attention never drifted far from each other.
          </p>
        </div>

        {/* Right image */}
        <figure className="md:col-start-7 md:col-end-13">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-black/5 shadow">
            <Image
              src="/pic.jpg"
              alt="John & Kristen"
              fill
              sizes="(max-width:768px) 100vw, 640px"
              className="object-cover"
              priority
            />
          </div>
        </figure>
      </div>

      {/* Row 2 — image (left, red-box size) + paragraph (right, green area) */}
      <div className="md:col-start-1 md:col-end-13 mt-10">
        <div className="md:flex md:items-start md:gap-6">
          {/* Image (match red-box feel & rounded/ring/shadow) */}
          <div
            className="
              relative shrink-0
              w-[340px] h-[210px]
              md:w-[360px] md:h-[230px]
              rounded-2xl overflow-hidden ring-1 ring-black/5 shadow
              mb-4 md:mb-0
            "
          >
            <Image
              src="/about.jpg"
              alt="Our moment"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Text (green area) */}
          <div className="flex-1">
            <p className="leading-7 text-[#2f2d2b]">
              They quickly realized how much they had in common — both the eldest in their
              families, volunteering at the same place, and sharing a strong desire to grow
              deeper in their faith. Not long after, John invited Kristen out for coffee —
              though in truth, he wanted more time together, so their first official date
              ended up being at Kinjo. The date went well, to say the least. What started
              as one meal has turned into countless more, and soon, a lifetime of them
              together.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</FadeInSection>




      {/* Love Story — Row 2 (alternate layout) */}
<FadeInSection>
  <section id="engagement" className="bg-[#f6f2ee] py-16 md:py-24">
      <div className="relative max-w-6xl mx-auto px-6">
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
                  src="/about4.jpg"
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
                src="/about11.jpg"
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

{/* Gallery */}
<FadeInSection>
  <section id="gallery" className="bg-[#f6f2ee] py-16 md:py-24">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-10 md:mb-14">
        <h2 className="font-great-vibes text-4xl md:text-5xl text-[#3e3a37] leading-tight">
          Gallery
        </h2>
      </div>

      {/* Row 1 — 3 tall images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {["/Gallery1.jpg","/Gallery2s.jpg","/Gallery3.jpg"].map((src, i) => (
          <div
            key={i}
            className="relative aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white"
          >
            <Image
              src={src}
              alt={`Gallery ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

     {/* Row 2 — two tall images, full width */}
<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Card 1 */}
  <figure className="group relative h-[520px] overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white">
    <Image
      src="/Gallery4.jpg"
      alt="Gallery 4"
      fill
      sizes="(max-width:768px) 100vw, 50vw"
      className="object-cover transform-gpu transition-transform duration-700 ease-out
                 group-hover:scale-[1.08] group-hover:rotate-[0.6deg] group-hover:translate-y-1"
      priority={false}
    />
    {/* optional soft darken on hover */}
    <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/5" />
  </figure>

  {/* Card 2 */}
  <figure className="group relative h-[520px] overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white">
    <Image
      src="/Gallery5.jpg"
      alt="Gallery 5"
      fill
      sizes="(max-width:768px) 100vw, 50vw"
      className="object-cover transform-gpu transition-transform duration-700 ease-out
                 group-hover:scale-[1.08] group-hover:rotate-[0.6deg] group-hover:translate-y-1"
    />
    <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/5" />
  </figure>
</div>




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
        src="/church.jpg"
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
        src="/hotel.jpg"
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
  <section id="attire" className="bg-[#e8e4d5] py-16 md:py-24">
    <div className="max-w-6xl mx-auto px-6">
      {/* Heading */}
      <div className="text-center">
        <p className="tracking-[0.28em] text-[11px] md:text-xs uppercase text-[#8a7566]">Formal</p>
        <h2 className="font-great-vibes text-4xl md:text-5xl text-[#3e3a37] leading-tight">Attire</h2>
      </div>

      {/* Lineup image — centered & larger */}
      <div className="mt-10 flex justify-center text-[#3e3a37]">
        <div className="relative w-[520px] md:w-[700px] aspect-[26/13]">
          <Image
            src="/people_transparent.png"
            alt="Guest attire lineup"
            fill
            className="object-contain drop-shadow-md"
            sizes="(max-width:768px) 90vw, 700px"
            priority
          />
        </div>
      </div>

      {/* Palette */}
      <div className="mt-10 text-center">
        <p className="tracking-[0.25em] text-[11px] md:text-xs uppercase text-[#8a7566]">Palette</p>

        {/* Larger swatches */}
        <div className="mt-4 mx-auto w-full md:w-fit md:translate-x-4">
          <div className="grid grid-cols-5 gap-8 place-items-center">
            {[
              { src: '/green.png',  label: 'Sage Green' },
              { src: '/yellow.png', label: 'Butter Yellow' },
              { src: '/purple.png', label: 'Lavender purple' },
              { src: '/beige.png',  label: 'Neutral Beige' },
              { src: '/brown.png',  label: 'Caramel Brown' },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <div className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src={c.src} alt={c.label} fill className="object-cover" />
                </div>
                <span className="mt-2 block text-sm text-[#3e3a37]">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Note under palette (unchanged) */}
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
  <section id="rsvp" className="bg-[#d1b8c] text-[#3e3a37]">
    
    
    {/* Copy + Form */}
    <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
      {/* Headings */}
      <div className="text-center mb-10 md:mb-14">
        <p className="font-great-vibes text-2xl md:text-3xl text-[#806a5a]">we invite you to</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-serif tracking-normal">Celebrate Our Wedding</h2>
        <p className="mt-4 text-xs md:text-sm text-[#6b5a4e] tracking-wide">
          Please confirm your presence through the RSVP form by <strong>02.25.2026</strong>.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white/90 rounded-2xl shadow-xl p-6 md:p-10">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleRsvpSubmit}>
          {/* Name entry note */}
          <div className="md:col-span-2 mb-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            <p>Please enter <b>only your first and last name</b>. Don’t include middle names.</p>
            <p className="mt-1">
              Example: <span className="font-medium">First name:</span> “Jasmine”; <span className="font-medium">Last name:</span> “De&nbsp;Leon”.
            </p>
          </div>

          {/* First / Last */}
          <div className="flex flex-col">
            <label htmlFor="firstName" className="text-xs uppercase tracking-widest mb-2">First name</label>
            <input
              id="firstName" name="firstName" type="text" required
              pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+$" title="First name only (no middle names)."
              className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
              placeholder="e.g., Jasmine"
              onBlur={(e) => { e.currentTarget.value = e.currentTarget.value.trim().replace(/\s+/g, ''); syncGroupFromForm(e.currentTarget.form); }}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="lastName" className="text-xs uppercase tracking-widest mb-2">Last name</label>
            <input
              id="lastName" name="lastName" type="text" required
              pattern="^[A-Za-zÀ-ÖØ-öø-ÿ'’ -]+$" title="Last name only (e.g., De Leon)."
              className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
              placeholder="e.g., De Leon"
              onBlur={(e) => { e.currentTarget.value = e.currentTarget.value.trim().replace(/\s{2,}/g, ' '); syncGroupFromForm(e.currentTarget.form); }}
            />
          </div>

          {/* Email / Phone */}
          <div className="flex flex-col">
            <label htmlFor="email" className="text-xs uppercase tracking-widest mb-2">Email</label>
            <input id="email" name="email" type="email" required className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]" placeholder="you@example.com" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="phone" className="text-xs uppercase tracking-widest mb-2">Phone (optional)</label>
            <input id="phone" name="phone" type="tel" className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]" placeholder="(xxx) xxx-xxxx" />
          </div>

          {/* Attendance */}
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

          {/* FAMILY (if loaded) */}
          {showFamily && family.length > 0 && (
            <div className="md:col-span-2">
              <div className="rounded-xl border border-[#d8cfc6] bg-white/90 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold tracking-wide text-[#3e3a37]">Select who from your family is attending</h3>
                  <span className="text-xs text-[#6b5a4e]">Group: <b>{groupId}</b></span>
                </div>
                <div className="divide-y divide-[#eee4da]">
                  {family.map((p, i) => {
                    const full = `${p.first_name} ${p.last_name}`;
                    return (
                      <label key={`${full}-${i}`} className="flex items-center justify-between py-2 px-2 hover:bg-[#f7f2ee] rounded-lg">
                        <span className="capitalize">{full}</span>
                        <input type="checkbox" className="h-5 w-5 accent-[#c8b6a6]" checked={!!selected[full]} onChange={() => toggleMember(full)} />
                      </label>
                    );
                  })}
                </div>
                <input type="hidden" name="guests" value={selectedCount} />
                <p className="mt-3 text-[11px] text-[#6b5a4e]">(Check everyone who’s coming — including yourself.)</p>
              </div>
            </div>
          )}

          {/* Dietary */}
          <div className="flex flex-col">
            <label htmlFor="diet" className="text-xs uppercase tracking-widest mb-2">Dietary restrictions (optional)</label>
            <input id="diet" name="diet" type="text" className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]" placeholder="Allergies, vegetarian, etc." />
          </div>

          

          {/* Submit */}
          <div className="md:col-span-2 flex justify-center pt-2">
            <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit RSVP'}</button>
          </div>
        </form>
      </div>

      {/* note */}
      <p className="mt-6 text-center text-xs text-[#6b5a4e]">
        If plans change after submitting, please reach out so we can update seating &amp; meals.
      </p>
    </div>
  </section>
</FadeInSection>

<FadeInSection>
      <section id="accommodations" className="bg-[#f4f5ee] py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-6">
        <div className="relative bg-[#d1b8c]/95 rounded-2xl shadow-xl ring-1 ring-black/5 px-6 py-10 md:px-10 md:py-12 text-center">

          {/* heading */}
          <h2 className="text-5xl md:text-6xl text-[#3e3a37] leading-none">
  Hotels
</h2>

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
  <section id="contact" className="bg-[#c3cdbe] py-16 md:py-24">
    <div className="max-w-6xl mx-auto px-6">

      {/* Section heading — same style as "Hotels" */}
      <div className="text-center mb-10 md:mb-14">
        <h2 className="font-great-vibes text-4xl md:text-5xl text-[#3e3a37] leading-tight">
          Contact
        </h2>
      </div>

      <div className="grid gap-10 md:gap-14 md:grid-cols-3 items-center text-[#3e3a37]">
        {/* Left: John */}
        <div className="text-center md:text-right space-y-2">
          <h3 className="text-2xl font-serif">John</h3>
          <p className="text-sm">
            <span className="font-medium">Number: </span>
            <a
              href="tel:15878996309"
              className="underline decoration-dotted hover:opacity-80"
              aria-label="Call John at 587 899 6309"
            >
              587&nbsp;899&nbsp;6309
            </a>
          </p>
          <p className="text-sm">
            <span className="font-medium">Email: </span>
            <a
              href="mailto:johnandkristen.deleon@gmail.com"
              className="underline decoration-dotted hover:opacity-80 whitespace-nowrap sm:whitespace-normal"

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
          <h3 className="text-2xl font-serif">Kristen</h3>
          <p className="text-sm">
            <span className="font-medium">Number: </span>
            <a
              href="tel:14036136976"
              className="underline decoration-dotted hover:opacity-80"
              aria-label="Call Kristen at 403 613 6976"
            >
              403&nbsp;613&nbsp;6976
            </a>
          </p>
          <p className="text-sm">
            <span className="font-medium">Email: </span>
            <a
              href="mailto:johnandkristen.deleon@gmail.com"
              className="underline decoration-dotted hover:opacity-80 whitespace-nowrap sm:whitespace-normal"

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
