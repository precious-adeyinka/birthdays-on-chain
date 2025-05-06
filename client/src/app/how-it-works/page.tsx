// components
import type { Metadata } from "next";
import HowItWorks from "@/app/ui/how-it-works/HowItWorks"

export const metadata: Metadata = {
  title: "How It Works"
};

export default function HowItWorksPage() {
  return (
    <div className="h-auto w-full overflow-x-hidden">
      <HowItWorks />
    </div>
  );
}
