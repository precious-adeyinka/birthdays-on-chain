"use client";

import Image from "next/image";
import { formatBirthday } from "@/app/libs/utils/index";

import EtherBalance from "./EtherBalance";
import BOCBalance from "./BOCBalance";

interface IUser {
  fullname: string;
  nickname: string;
  gender: string;
  photo: string;
  joinedDate: number;
  isActive: boolean;
  hasSubscription: boolean;
}

export default function ProfileHeader({
  data,
  etherBalance,
  bocBalance,
  onEtherWithdrawn,
  onBocWithdrawn,
}: {
  data: IUser;
  etherBalance: bigint;
  bocBalance: bigint;
  onEtherWithdrawn: () => void;
  onBocWithdrawn: () => void;
}) {
  return (
    <section className="h-auto w-11/12 md:w-2/5 mx-auto rounded-lg bg-gradient-to-r from-orange-500 via-blue-500 to-pink-500 position relative pb-5 flex flex-col items-center justify-center">
      <div className="h-auto w-auto rounded-full bg-white ring-[10px] ring-white relative overflow-hidden absolute -top-10 bg-center">
        <Image
          src={data?.photo || "/assets/images/avatars/avatar-1.png"}
          alt={`${data?.nickname} Avatar`}
          height={80}
          width={80}
          className="md:hidden"
        />

        <Image
          src={data?.photo}
          alt={`${data?.nickname} Avatar`}
          height={60}
          width={60}
          className="hidden md:block"
        />
      </div>

      {/* content */}
      <div className="h-auto flex flex-col items-center justify-center -mt-5">
        <h2 className="text-lg text-white font-medium capitalize">
          {data?.fullname}
        </h2>
        <p className="text-xs text-white/80 mt-0.5">{`Joined ${formatBirthday(
          Number(data?.joinedDate)
        )}`}</p>
      </div>

      {/* ETH BALANCE */}
      <EtherBalance balance={etherBalance} onWithdraw={onEtherWithdrawn} />

      {/* BOC BALANCE */}
      <BOCBalance balance={bocBalance} onWithdraw={onBocWithdrawn} />
    </section>
  );
}
