// /src/app/thank-you/page.js
import Image from "next/image";

// Make sure this isn't statically prerendered
export const dynamic = "force-dynamic";

export default async function ThankYouPage({ searchParams }) {
  // Next 15: searchParams is a Promise in server components
  const params = await searchParams;

  const firstName = (params?.firstName || "").toString();
  const lastName  = (params?.lastName  || "").toString();

  return (
    <div className="relative w-full h-screen">
      <Image
        src="/about3.jpg"
        alt="Wedding Thank You"
        fill
        className="object-cover brightness-90"
        priority
      />

      <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-6">
        <h1 className="mt-2 text-3xl md:text-4xl font-serif tracking-[-0.02em]">
          Thank you
        </h1>

        {(firstName || lastName) ? (
          <p className="text-3xl font-[var(--font-title,_inherit)]">
            Love, {firstName} {lastName}
          </p>
        ) : null}

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
