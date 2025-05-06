// components
import type { Metadata } from "next";
import Birthday from "@/app/ui/birthday/Birthday"

export const metadata: Metadata = {
  title: "Birthday"
};

export default function BirthdayPage() {
  return (
    <div className="h-auto w-full overflow-x-hidden">
      <Birthday />
    </div>
  );
}
