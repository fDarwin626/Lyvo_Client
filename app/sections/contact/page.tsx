"use client"
import ContactForm from "@/components/ContactForm";
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation'; 

export default function ContactPage() {
    const router = useRouter();
  return (
    <div className="min-h-screen bg-background py-10px-4 sm:px-6 lg:px-10">
        <div className="bg-white/10  p-8">
        <button
        onClick={() => router.push ("/")}
        className=" font-amiamie-round"
        >
          <Icon icon="mdi:backburger" width="24" height="24"  className="text-primary" />
        </button>
        </div>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-amiamie text-primary mb-4 ">
            Get in Touch
          </h1>
          <div className="space-y-2 text-secondary">
            <p className="text-lg">Got any questions? Curious about how it's built?</p>
            <p className="text-lg">Looking for a developer? Want to contribute or sponsor Lyvo?</p>
          </div>
          <p className="mt-6 text-xl text-black font-semibold font-amiamie">
            Reach out to us!
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}