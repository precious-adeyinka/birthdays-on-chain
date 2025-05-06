// components
import type { Metadata } from "next";
import Profile from "@/app/ui/profile/Profile"

export const metadata: Metadata = {
  title: "Profile"
};

export default function ProfilePage() {
  return (
    <div className="h-auto w-full overflow-x-hidden">
      <Profile />
    </div>
  );
}
