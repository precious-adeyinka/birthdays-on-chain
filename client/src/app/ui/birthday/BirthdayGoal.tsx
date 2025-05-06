import clsx from "clsx";
import { poppins } from "@/app/fonts";

import { formatEther } from "viem";

interface IGoal {
  createdAt: bigint;
  description: string;
  targetAmount: bigint;
  amountRaised?: bigint;
}

interface IUser {
  uid: string;
  fullname: string;
  nickname: string;
  gender: string;
  currency: bigint;
  photo: string;
  joinedDate: number;
  isActive: boolean;
  hasSubscription: boolean;
}

export default function BirthdayGoal({
  userData,
  goal,
}: {
  userData: IUser;
  goal: IGoal;
}) {
  const calculateWidthClass = (targetAmount: bigint, amountRaised: bigint) => {
    const target = Number(formatEther(targetAmount));
    const raised = Number(formatEther(amountRaised));

    if (target === raised) {
      return `w-full`;
    } else {
      const percentage = (raised / target) * 100;
      const cappedPercentage = Math.min(percentage, 100);
      const widthClass = Math.round((cappedPercentage / 100) * 12);
      return `w-${widthClass}/12`;
    }
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      <header className="h-auto w-full flex items-center justify-between">
        <h2
          className={clsx(
            poppins.className,
            "w-full text-md font-medium pb-3 border-b border-gray-200"
          )}
        >
          Birthday Goal
        </h2>
      </header>

      <div className="h-auto w-full flex flex-col items-start justiy-start">
        <p className="text-[13px] font-medium text-gray-500">
          {goal?.description}
        </p>

        {/* progress */}
        <div className="h-2 w-full rounded-full bg-gray-100 flex items-center justify-start overflow-hidden my-3">
          <div
            className={`h-full ${calculateWidthClass(
              goal?.targetAmount || BigInt(0),
              goal?.amountRaised || BigInt(0)
            )} bg-gradient-to-r from-orange-500 via-blue-500 to-pink-500 transition-all duration-700`}
          ></div>
        </div>
        {/* info */}
        <div className="w-full flex items-center justify-between">
          <div className="flex flex-col items-start justify-start">
            <p className="text-[10px] font-medium text-gray-500">Target</p>
            <p className="text-xs font-medium text-gray-800">
              {userData?.currency === BigInt(0) ? "BOC" : "ETH"}&nbsp;
              {formatEther(goal?.targetAmount || BigInt(0))}
            </p>
          </div>

          <div className="flex flex-col items-start justify-end">
            <p className="text-[10px] font-medium text-gray-500">Raised</p>
            <p className="text-xs font-medium text-gray-800">
              {userData?.currency === BigInt(0) ? "BOC" : "ETH"}&nbsp;
              {formatEther(goal?.amountRaised || BigInt(0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
