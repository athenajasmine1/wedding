"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center p-8 bg-cover bg-center" style={{ backgroundImage: "url('/backg1.png')" }}>
      <h1 className="text-6xl font-great-vibes text-white mb-6">Thank You, {firstName} {lastName}!</h1>
      <p className="text-4xl text-white font-great-vibes">Your confirmation has been received. 💍</p>
      <p className="text-3xl text-white font-great-vibes mt-4">A Confirmation email will be sent to you shortly.</p>
    </div>
  );
}
