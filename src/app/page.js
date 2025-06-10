"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import FadeInSection from "../components/FadeInSection";




export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2026-04-25T00:00:00");

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

return (
  


    <main className="animate-fade-in-pop min-h-screen overflow-y-scroll">
      <header className="w-full bg-amber-500 py-6 px-8 rounded-b-[40px]">
        <div className="w-full text-center">
          <div className="w-full bg-amber-500 px-10 py-4 text-white font-bold text-xl">
            <div className="flex justify-between items-center max-w-full">
              <h1 className="text-white text-xl font-bold">John & Kristen</h1>
              <nav className="flex space-x-10 font-semibold">
                <a href="#home" className="text-white hover:underline">Home</a>
                <a href="#about" className="text-white hover:underline">About</a>
                <a href="#rsvp" className="text-white hover:underline">RSVP</a>
                <a href="#map" className="text-white hover:underline">Wedding</a>
                <a href="#contact" className="text-white hover:underline">Contact</a>
              </nav>
            </div>
          </div>
        </div>
      </header>

       <main className="flex flex-col items-center justify-start min-h-screen p-8 pt-20">
        {/* Holding Hands Image with Centered Date Overlay */}
        <div className="relative overflow-hidden rounded-[40px] w-[730px] h-[550px] mt-20">
          <Image
            className="rounded-xl object-cover w-full h-full"
            src="/holding.png"
            alt="Holding Hands"
            width={730}
            height={730}
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className=" text-white text-3xl font-bold px-6 py-2 rounded-full">
              04.25.2026
            </span>
          </div>
        </div>

        <FadeInSection>

          {/* Countdown Timer Below the Image */}
      <div className="bg-amber-500 text-white p-4 rounded-xl text-2xl font-bold my-10">
        <p>
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </p>
        <p className="text-sm text-white">until the big day!</p>
      </div>


        </FadeInSection>

        

        



        {/* About Section */}

        <FadeInSection>
          <section id="about" className="mt-24 w-full max-w-6xl px-4">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">About</h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Left image */}
            <div className="w-[300px] h-[300px] rounded-3xl overflow-hidden flex-shrink-0">
              <Image
                className="object-cover"
                src="/about1.jpeg"
                alt="John and Kristen"
                width={300}
                height={300}
              />
            </div>

            {/* Right paragraph */}
            <div className="text-white text-lg max-w-xl text-center md:text-left">
              <p>
                John and Kristen met through Singles for Christ, a church group, and from the very first conversation during a fellowship, something just clicked. It wasn’t long before they started noticing each other a little more—especially during the next event, when they caught each other glancing from opposite sides of the room. That moment gave John the push he needed to ask Kristen out for coffee.
              </p>
            </div>
          </div>

           {/* Second Row */}
          <div className="flex flex-col md:flex-row-reverse items-center justify-center gap-10">
            <div className="w-[300px] h-[300px] rounded-3xl overflow-hidden flex-shrink-0">
              <Image
                className="object-cover w-full h-full"
                src="/about2.jpeg"
                alt="Dinner date"
                width={400}
                height={400}
              />
            </div>
            <div className="text-white text-lg max-w-xl text-center md:text-left">
              <p>
                Coffee turned into dinner. Their first plan was to meet on a Thursday, but John, clearly eager, asked her out for Monday instead. She agreed. On the way to dinner, Kristen asked if this was in place of Thursday. John simply asked, “Would you still like to meet then?” She replied, “Depends on how tonight goes.”
              </p>
              <br />
              <p>
                Well—Thursday happened. Safe to say that this first date would secure the rest of their Thursdays after that.
              </p>
            </div>
          </div>
          
              
        </section>


        </FadeInSection>
        
      <FadeInSection>

        {/* RSVP Section */}
        <section id="rsvp" className="mt-32 w-full px-6 py-16 text-center bg-transparent">
          <h2 className="text-3xl font-script font-bold text-white mb-4">We Invite you</h2>
          <h3 className="text-2xl font-script text-white mb-2">to Celebrate our Wedding</h3>
          <p className="text-xl font-script text-white mb-10">--RSVP--</p>

          <form

           className="max-w-md mx-auto space-y-6"
           onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/thank-you";
            }}
          >

            <div className="flex flex-col items-start">
              <label htmlFor="firstName" className="text-white text-left w-full mb-1">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="w-full rounded-full px-6 py-2 bg-white text-black focus:outline-none"
              />
            </div>
            <div className="flex flex-col items-start">
              <label htmlFor="lastName" className="text-white text-left w-full mb-1">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="w-full rounded-full px-6 py-2 bg-white text-black focus:outline-none"
              />
            </div>
            <div className="flex flex-col items-start">
              <label htmlFor="email" className="text-white text-left w-full mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-full px-6 py-2 bg-white text-black focus:outline-none"
              />
            </div>
            <div className="flex flex-col items-start">
              <label htmlFor="number" className="text-white text-left w-full mb-1">Number</label>
              <input
                id="number"
                name="number"
                type="text"
                className="w-full rounded-full px-6 py-2 bg-white text-black focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2 rounded-full shadow-lg"
            >
              Submit
            </button>
          </form>
        </section>


      </FadeInSection>
        

        <FadeInSection>

          {/* Map Section */}
        <section id="map" className="mt-20 w-full max-w-6xl text-center">
          <h2 className="text-4xl font-script text-white mb-4">Wedding</h2>
          <p className="text-xl font-script text-white mb-10">Map</p>
          <p className="text-lg font-script text-white mb-10">The Shrine Church of Our Lady of the Rockies</p>

          <div className="flex flex-col md:flex-row justify-center gap-6 mb-6">
            <div className="rounded-3xl overflow-hidden w-[300px] h-[220px]">
              <Image
                className="object-cover w-full h-full"
                src="/church.jpeg"
                alt="Church"
                width={300}
                height={220}
              />
            </div>
            <div className="rounded-3xl overflow-hidden w-[300px] h-[220px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2519.065513197622!2d-115.34850228418657!3d51.08929187956756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5370c51c25415555%3A0xf01665e84e731c2f!2sOur%20Lady%20of%20the%20Rockies%20Catholic%20Church!5e0!3m2!1sen!2sca!4v1717677708000!5m2!1sen!2sca"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <p className="text-lg font-script text-white mb-10">The Malcolm Reservation Canmore</p>
          <div className="flex flex-col md:flex-row-reverse justify-center gap-6">
            <div className="rounded-3xl overflow-hidden w-[300px] h-[220px]">
              <Image
                className="object-cover w-full h-full"
                src="/hotel.jpeg"
                alt="Hotel"
                width={300}
                height={220}
              />
            </div>
            <div className="rounded-3xl overflow-hidden w-[300px] h-[220px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2519.0655738298505!2d-115.3521680841865!3d51.08929077956713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5370c51d7e0c4eb7%3A0xe86991ce4b1d55fc!2sThe%20Malcolm%20Hotel%20by%20CLIQUE!5e0!3m2!1sen!2sca!4v1717677808000!5m2!1sen!2sca"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>



        </FadeInSection>

        <FadeInSection>

          {/* Dress Code Section */}
        <section id="dresscode" className="mt-32 w-full text-center">
          <div className="mb-0 mt-10">
            <h2 className="text-4xl font-script text-white">-- Dress code --</h2>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-end gap-4 mt-[-20px]">
            <div className="w-[420px] h-[840px]">
              <Image
                className="object-contain w-full h-full"
                src="/dress.png"
                alt="Dress Code - Women"
                width={420}
                height={840}
              />
            </div>
            <div className="w-[300px] h-[600px] relative bottom-24">
              <Image
                className="object-contain w-full h-full"
                src="/suit.png"
                alt="Dress Code - Men"
                width={300}
                height={600}
              />
            </div>
          </div>
        </section>


        </FadeInSection>
        
           

        <FadeInSection>
          {/* Schedule Section */}
          <section id="schedule" className="mt-10 w-full text-center text-white font-script">
            <h2 className="text-4xl mb-8">-- Schedule --</h2>
          <div className="max-w-3xl mx-auto text-left text-xl leading-loose">
            <p><strong className="text-amber-500">2:00 PM – Ceremony</strong><br />Shrine Church of Our Lady of the Rockies<br /><em>Join us as we say "I do" in a sacred and joyful celebration of our love.</em></p>
            <br />
            <p><strong className="text-amber-500">5:00 PM – Cocktail Hour</strong><br />The Malcolm Hotel, Canmore<br /><em>Enjoy light bites, drinks, and good company while we sneak away for some photos!</em></p>
            <br />
            <p><strong className="text-amber-500">6:00 PM – Reception</strong><br />The Malcolm Hotel, Canmore<br /><em>Let the celebration begin! Dinner, speeches, dancing, and unforgettable memories to follow.</em></p>
          </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          {/* Contacts Section */}
          <section id="contact" className="mt-20 w-full flex justify-center">
          <div className="bg-[#935774] rounded-t-[40px] px-10 py-8 w-full text-center font-script text-white">
            <h2 className="text-3xl text-white mb-4">-- Contacts --</h2>
            <p className="text-amber-300">Kristen (403) XXX XXXX</p>
            <p className="text-amber-300">kristen@wemail.com</p>
            <p className="text-amber-300 mt-4">John De Leon</p>
            <p className="text-amber-300">(587) 389-6579</p>
            <p className="text-amber-300">johndeleon233@gmail.com</p>
          </div>
        </section>
        </FadeInSection>

         
       </main>


    </main>

    
      

        
  );
}
