// components
import type { Metadata } from "next";
import Birthdays from "@/app/ui/birthdays/Birthdays"

export const metadata: Metadata = {
  title: "Birthdays"
};

export default function BirthdaysPage() {
  return (
    <div className="h-auto w-full overflow-x-hidden">
      <Birthdays />
    </div>
  );
}
