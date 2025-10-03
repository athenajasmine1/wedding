"use client";

import FadeInSection from "../components/FadeInSection";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";

export default function Home() {
  
  const [submitting, setSubmitting] = useState(false); // ⬅️ add this

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
    <main className="bg-[#e9ded3] font-sans">
      
      <FadeInSection>
        <section
        id="home"
        className="relative w-full h-screen flex items-center justify-center"
      >

      <Image
          src="/holding.png"
          alt="Couple"
          fill
          className="object-cover brightness-75"
          priority
        />
        
      {/* header OVER the image (no space) */}
        <header className="absolute inset-x-0 top-0 z-50">
          {/* Top name bar */}
          <div className="w-full bg-[#f6efe9]/90 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <h1 className="text-center font-serif text-2xl md:text-3xl tracking-[0.35em] uppercase text-[#3e3a37]">
                JOHN & KRISTINE
              </h1>
            </div>
            <div className="border-b border-[#d9cfc7]" />
          </div>

        {/* Slim nav strip */}
          <nav className="w-full bg-[#e9ded3]/90 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6">
              <ul className="flex items-center justify-center gap-6 md:gap-10 text-sm uppercase tracking-[0.25em] text-[#3e3a37]">
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

        <div className="relative z-10 text-center">
          <h1 className="text-6xl md:text-8xl font-serif tracking-wide  text-white">
            JOHN & KRISTEN
          </h1>
          <p className="mt-4 text-2xl font-great-vibes italic  text-white">
            are getting married!
          </p>
          <p className="mt-2 text-lg tracking-widest  text-white">APRIL 25, 2026</p>
        </div>
      </section>
      
      </FadeInSection>

      {/* Love Story */}
      <FadeInSection>
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-12">
        {/* Text */}
        <div className="md:w-1/2">
          <h2 className="text-4xl font-great-vibes mb-6">
            This is our love story
          </h2>
          <p className="leading-relaxed text-black mb-4">
            If you ask John, he’ll say he saw Kristen first. But technically, Kristen spotted him before he ever knew it. Months before they officially met, a friend had wanted to introduce Kristen to another John De Leon. Out of curiosity, she searched him up on social media — only to stumble upon a different profile: John Gabriel De Leon, the man who would one day become her husband.
          </p>
          <p className="leading-relaxed text-black mb-4">
           Months later, their paths finally crossed when both were invited by a mutual friend to SFC’s Christian Life Program. During a fellowship after one of the events, John chose a seat across from Kristen, and even though the table was full, their attention never drifted far from each other. They quickly realized how much they had in common — both being the eldest in their families, volunteering at the same place, and sharing a strong desire to grow deeper in their faith.

          </p>
          <p className="leading-relaxed text-black">
            Not long after, John invited Kristen out for coffee — though in truth, he wanted more time together, so their first official date ended up being at Kinjo.

          The date went well, to say the least. What started as one meal has turned into countless more, and soon, a lifetime of them together.


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
          />
        </div>
      </section>      
      </FadeInSection>

      {/* Love Story — Row 2 (alternate layout) */}
<FadeInSection>
  <section className="max-w-6xl mx-auto px-6 py-16">
    <div className="flex flex-col md:flex-row-reverse items-center gap-10">
      {/* Text (right on desktop) */}
      <div className="md:w-1/2 text-[#2b2a28] leading-relaxed">
        <h3 className="text-4xl font-great-vibes mb-6">Our Engagement</h3>
        <p className="mb-4">
          We got engaged on the Platform, with the city skyline behind us and the sun setting. I’d told Kristen we were just stopping to take a quick photo, but waiting nearby were the people who built us: both of our parents and our siblings. 
        </p>
        <p className="mb-4">
          When she turned back to me, I took her hands, told her how every little ordinary day with her has felt like the best one, and asked if we could make a lifetime of them. She said “yes” (twice), and our families rushed in for hugs. The memory is everything we hoped for, with both of our families there to bless the beginning of the rest of our life together.

        </p>
      </div>

      {/* Photo (left on desktop) */}
      <div className="md:w-1/2 rounded-2xl overflow-hidden">
        <Image
          src="/about2.jpeg"            // change to your second photo if you have one, e.g. /about3.jpeg
          alt="John & Kristen — another moment"
          width={800}
          height={530}
          className="object-cover w-full h-auto"
          priority={false}
        />
      </div>
    </div>
  </section>
</FadeInSection>


      <FadeInSection>

        <section id="rsvp" className="bg-[#efe7df] text-[#3e3a37]">
    {/* Photo header */}
    <div className="relative w-full h-[40vh] min-h-[320px]">
      <Image
        src="/about2.jpeg"           // <-- your image
        alt="John & Kristen"
        fill
        className="object-cover"
        priority
      />
      {/* subtle dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl md:text-6xl font-serif tracking-wide text-white">
          JOHN & KRISTINE
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
        <h2 className="mt-2 text-3xl md:text-4xl font-serif tracking-[0.2em] uppercase">
          Celebrate Our Wedding
        </h2>
        <p className="mt-4 text-xs md:text-sm text-[#6b5a4e] tracking-wide">
          Please confirm your presence through the RSVP form by <strong>07.15.2025</strong>.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white/90 rounded-2xl shadow-xl p-6 md:p-10">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleRsvpSubmit}
        >
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
              className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
              placeholder="e.g., Kristen"
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
              className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
              placeholder="e.g., Mendoza"
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
            <span className="text-xs uppercase tracking-widest mb-2">
              Will you attend?
            </span>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="attending"
                  value="yes"
                  defaultChecked
                  className="accent-[#c8b6a6]"
                />
                <span>Yes, can’t wait!</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="attending"
                  value="no"
                  className="accent-[#c8b6a6]"
                />
                <span>Sorry, can’t make it</span>
              </label>
            </div>
          </div>

          {/* Guests / Dietary */}
          <div className="flex flex-col">
            <label htmlFor="guests" className="text-xs uppercase tracking-widest mb-2">
              Number of guests (including you)
            </label>
            <select
              id="guests"
              name="guests"
              className="rounded-lg border border-[#d8cfc6] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8b6a6]"
              defaultValue="1"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
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
              {submitting ? "Submitting…" : "Submit RSVP"}
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
      {/* WEDDING TIMELINE */}
<section id="timeline" className="w-full bg-[#e6d8c7] text-[#2b2a28] py-16 md:py-24">

  {/* Constrain everything to a centered column */}
  <div className="mx-auto max-w-4xl px-6">
    {/* Title */}
    <h2 className="text-center font-serif tracking-[0.25em] text-4xl md:text-5xl uppercase mb-12">
      Wedding<br className="hidden md:block" /> Timeline
    </h2>

    {/* The grid that holds both columns AND the center line */}
    <div className="relative mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-16">
      {/* center vertical line (inside same relative box) */}
      <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-[#2b2a28]/50 z-0" />

      {/* LEFT column */}
      <div className="md:pr-12 space-y-10 md:space-y-12">
        {[
          ["1:00 PM", "Bride & Groom Get Dressed"],
          ["2:00 PM", "Wedding Party Photos"],
          ["3:00 PM", "Couple Hides for Ceremony"],
          ["4:00 PM", "Cocktail Hour Begins"],
          ["4:50 PM", "Prep for Grand Entrance"],
          ["5:15 PM", "Dinner Served"],
          ["6:00 PM", "Speeches"],
        ].map(([time, label]) => (
          <div key={time} className="relative md:text-right z-10">
            <span className="hidden md:block absolute right-[-7px] top-2 h-3 w-3 rounded-full bg-[#2b2a28]" />
            <p className="font-semibold text-sm tracking-wider">{time}</p>
            <p className="uppercase text-xs opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* RIGHT column */}
      <div className="md:pl-12 space-y-10 md:space-y-12">
        {[
          ["11:30 AM", "Photographer Arrives"],
          ["1:45 PM", "First Look"],
          ["2:30 PM", "Family Group Photos"],
          ["3:30 PM", "Ceremony"],
          ["4:30 PM", "Remaining Group Photos"],
          ["5:00 PM", "Grand Entrance"],
          ["7:20 PM", "Cake Cutting"],
          ["7:30 PM", "Party & Dancing"],
        ].map(([time, label]) => (
          <div key={time} className="relative z-10">
            <span className="hidden md:block absolute left-[-7px] top-2 h-3 w-3 rounded-full bg-[#2b2a28]" />
            <p className="font-semibold text-sm tracking-wider">{time}</p>
            <p className="uppercase text-xs opacity-80">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
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

    {/* w*/}
      <FadeInSection>
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-12">
        {/* Text */}
        <div className="md:w-1/2">
          <h2 className="text-4xl font-great-vibes mb-6">
           Malcom Hotel


          </h2>
          <p className="leading-relaxed text-black mb-4">
            Discount code:2604DELE.
Hotel Number: 403.812.0680
Website Link:malcolmhotel.ca

          </p>
          <p className="leading-relaxed text-black mb-4">
           Note from Hotel: 


          </p>
          <p className="leading-relaxed text-black">
            The Malcolm Hotel will provide a booking code for your guests to apply a twenty
percent (20%) discount off the best flexible rate. Please note a two-night minimum may apply
during certain dates.



          </p>
        </div>
        {/* Image */}
        <div className="md:w-1/2 rounded-2xl overflow-hidden">
          <Image
            src="/wed2.jpg"
            alt="photo"
            width={600}
            height={400}
            className="object-cover"
          />
        </div>
      </section>      
      </FadeInSection>

      <FadeInSection>
      <div className="mt-20 text-center space-y-10">
        {/* Attire */}
        <div>
          <h3 className="text-xl uppercase tracking-widest mb-4">Attire</h3>
          <p className="text-sm opacity-80">Formal</p>
          <p className="mt-2">Gentlemen: Barong with black slacks</p>
          <p>Ladies: Long gowns and dresses</p>
      </div>
      {/* Palette */}
      <div>
        <h3 className="text-xl uppercase tracking-widest mb-4">Palette</h3>
        <div className="flex justify-center gap-4">
          <Image src="/color1.png" alt="Color 1" width={50} height={50} className="rounded-full" />
          <Image src="/color2.png" alt="Color 2" width={50} height={50} className="rounded-full" />
          <Image src="/color3.png" alt="Color 3" width={50} height={50} className="rounded-full" />
          <Image src="/color4.png" alt="Color 4" width={50} height={50} className="rounded-full" />
          <Image src="/color5.png" alt="Color 5" width={50} height={50} className="rounded-full" />
          <Image src="/color6.png" alt="Color 6" width={50} height={50} className="rounded-full" />
      </div>
    </div>

    {/* Gifts */}
  <div className="pb-16">   {/* ⬅ added padding-bottom */}
  <h3 className="text-xl uppercase tracking-widest mb-4">Gifts</h3>
  <p className="text-sm max-w-xl mx-auto opacity-80">
    Your presence at our wedding is the greatest gift of all. If you wish to honor us with a gift, 
    a contribution towards our future together would be greatly appreciated.
  </p>
</div>
</div>
    </FadeInSection>

      
    

      <FadeInSection>
      <section
      id="contact"
      className="w-full bg-[#918073] text-white py-16 px-6 font-great-vibes"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl mb-8">-- Contacts --</h2>
          <div className="space-y-4 text-2xl">
            <p>
              <span className="font-semibold">Kristen</span> — (403) 613-6976
            </p>
            <p>
              <span className="font-semibold">Email:</span>johnandkristen.deleon@gmail.com
            </p>
            <p>
              <span className="font-semibold">John De Leon</span> —  587 899 6309


            </p>
            <p>
              
            </p>

          </div>

        </div>

      </section>
      </FadeInSection>
    </main>
  );
}
