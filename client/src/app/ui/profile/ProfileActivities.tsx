import clsx from "clsx";
import { poppins } from "@/app/fonts";

import ProfileTabs from "./ProfileTabs";

interface IUser {
  fullname: string;
  nickname: string;
  gender: string;
  photo: string;
  currency: bigint;
  isActive: boolean;
  hasSubscription: boolean;
}

export default function ProfileActivities({ user }: { user: IUser }) {
  return (
    <div className="rounded-md border border-gray-300 h-auto w-full md:w-1/2 flex flex-col items-start justify-start space-y-5 overflow-x-hidden overflow-y-auto">
      <header className="hidden h-auto w-full flex items-center justify-between">
        <h2
          className={clsx(
            poppins.className,
            "w-full text-md font-medium pb-3 border-b border-gray-200"
          )}
        >
          On-Chain Activities
        </h2>
      </header>

      <ProfileTabs user={user} />
    </div>
  );
}
