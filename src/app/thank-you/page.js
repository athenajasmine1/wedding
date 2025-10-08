"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");

  return (
    <div className="relative w-full h-screen">
      {/* Background image */}
      <Image
        src="/about1.jpeg"
        alt="Wedding Thank You"
        fill
        className="object-cover brightness-90"
        priority
      />

      {/* Overlay text */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-6">
        <h1 className="mt-2 text-3xl md:text-4xl font-serif tracking-[-0.02em]">
          Thank you
        </h1>
        <p className="text-3xl font-great-vibes">
          Love, {firstName} {lastName}
        </p>
        <p className="mt-4 text-lg md:text-2xl font-light italic">
          Your confirmation has been received
        </p>
        <p className="text-lg md:text-xl mt-2 font-light">
          A confirmation email will be sent to you shortly.
        </p>
      </div>
    </div>
  );
}

