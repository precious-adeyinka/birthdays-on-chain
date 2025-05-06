"use client";

import { useState, useEffect } from "react";

//deps
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { poppins } from "@/app/fonts";
import { MoveUpRight } from "lucide-react";

import { formatCurrentDate } from "@/app/libs/utils/index";

import Preloader from "@/app/ui/preloader/Loader";

import { ethers } from "ethers";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";

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

interface IEvent {
  user: string;
  when: string;
}

interface IGoal {
  createdAt: bigint;
  description: string;
  targetAmount: bigint;
  amountRaised?: bigint;
}

interface IBirthday {
  id: bigint;
  createdAt: bigint;
  when: bigint;
  goal: IGoal;
}

export default function BirthdayCard({
  event,
}: {
  event: ethers.Result | IEvent;
}) {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [birthdayData, setBirthdayData] = useState<IBirthday | null>(null);
  const [error, setError] = useState<string>("");

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

  // Fetch user data
  const getUser = async () => {
    try {
      const provider = await new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      const contract = await new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        usersFacet.abi,
        provider
      );
      const user = await contract.getUser(event.user);
      return user;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch user details:", error);
        setError(error?.message || "Failed to fetch user details");
      }
      console.log(error);
      return [];
    }
  };

  // Fetch user birthday
  const getUserBirthday = async () => {
    try {
      const provider = await new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      const contract = await new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        usersFacet.abi,
        provider
      );
      const birthday = await contract.getUserBirthdays(event.user);
      return birthday;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch user birthday:", error);
        setError(error?.message || "Failed to fetch user birthday");
      }
      console.log(error);
      return [];
    }
  };

  useEffect(() => {
    if (error) {
      setLoading(false);
    }

    getUser().then((userDetails) => {
      setLoading(false);
      setUserData(userDetails as IUser);
    });
    getUserBirthday().then((birthday) => {
      setLoading(false);
      setBirthdayData(birthday as IBirthday);
    });
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="h-auto w-full border border-gray-300 rounded-lg flex flex-col items-start justify-center space-y-4 p-5 relative">
      {/* image - avatar */}
      <div className="h-18 w-18 bg-gray-100  rounded-lg relative overflow-hidden">
        <Image
          src={userData?.photo || "/assets/images/avatars/avatar-1.jpg"}
          height={200}
          width={200}
          alt=""
        />
      </div>

      <div className="h-auto w-full flex flex-col items-start justify-center">
        <div className="h-auto w-full flex items-center justify-start space-x-2">
          <h2
            className={clsx(
              poppins.className,
              "text-lg md:text-sm font-medium text-black"
            )}
          >
            {userData?.fullname}
          </h2>

          {address === userData?.uid ? (
            <div className="bg-blue-500 text-white text-[12px] font-medium flex items-center justify-center rounded-full px-3 py-1">
              You
            </div>
          ) : null}
        </div>

        {birthdayData && Number(birthdayData.createdAt) > 0 ? (
          <p
            className={clsx(
              poppins.className,
              "text-xs font-normal text-gray-600 mt-1"
            )}
          >{`${formatCurrentDate(Number(birthdayData?.when))}`}</p>
        ) : (
          <p
            className={clsx(
              poppins.className,
              "text-xs font-normal text-gray-600 mt-1"
            )}
          >
            No birthday found
          </p>
        )}

        {birthdayData && Number(birthdayData.createdAt) > 0 && (
          <div className="h-auto w-full mt-4 flex flex-col items-start justiy-start">
            <h3 className="text-sm font-medium text-black">Birthday Goal</h3>
            <p className="text-[10px] font-medium text-gray-500 mt-1">
              {birthdayData.goal.description}
            </p>
            {/* progress */}
            <div className="h-2 w-full rounded-full bg-gray-100 flex items-center justify-start overflow-hidden my-3">
              <div
                className={`h-full ${calculateWidthClass(
                  birthdayData.goal.targetAmount || BigInt(0),
                  birthdayData.goal.amountRaised || BigInt(0)
                )} bg-green-500 transition-all duration-700`}
              ></div>
            </div>
            {/* info */}
            <div className="w-full flex items-center justify-between">
              <div className="flex flex-col items-start justify-start">
                <p className="text-[10px] font-medium text-gray-500">Target</p>
                <p className="text-xs font-medium text-gray-800">
                  {userData?.currency === BigInt(0) ? "BOC" : "ETH"}&nbsp;
                  {formatEther(birthdayData.goal.targetAmount || BigInt(0))}
                </p>
              </div>

              <div className="flex flex-col items-start justify-end">
                <p className="text-[10px] font-medium text-gray-500">Raised</p>
                <p className="text-xs font-medium text-gray-800">
                  {userData?.currency === BigInt(0) ? "BOC" : "ETH"}&nbsp;
                  {formatEther(birthdayData.goal.amountRaised || BigInt(0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* visit */}
      <Link
        href={`/birthday/${event?.user}`}
        className="h-12 w-12 flex items-center bg-black justify-center absolute top-3 right-3 transition-all duration-700 hover:rounded-full cursor-pointer"
      >
        <MoveUpRight color="white" size="20" />
      </Link>
    </div>
  );
}
