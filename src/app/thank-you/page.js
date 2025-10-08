'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

// Optional: make sure this page is never prerendered without the client
export const dynamic = 'force-dynamic';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get('firstName') || '';
  const lastName  = searchParams.get('lastName')  || '';

  return (
    <div className="relative w-full h-screen">
      {/* Background image (ensure /public/about1.jpeg exists) */}
      <Image
        src="/about1.jpeg"
        alt="Wedding Thank You"
        fill
        className="object-cover brightness-90"
        priority
      />

      {/* Overlay text */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-6">
        <h1 className="mt-2 text-3xl md:text-4xl font-serif tracking-[-0.02em]">Thank you</h1>
        <p className="text-3xl font-[var(--font-title,_inherit)]">
          Love{firstName || lastName ? ',' : ''} {firstName} {lastName}
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

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center text-xl">
          Loading…
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
