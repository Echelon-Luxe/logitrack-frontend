import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { Features, HowItWorks, Problems, Roles, TrustBar } from '@/components/landing/sections';
import { Faq } from '@/components/landing/faq';
import { ClosingCta, Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: { absolute: 'LogiTrack · Delivery tracking for Lagos businesses' },
  description: 'Book shipments, dispatch drivers and let customers watch every parcel to the doorstep.',
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <TrustBar />
        <Problems />
        <Features />
        <HowItWorks />
        <Roles />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
