"use client";

import { useState, useEffect } from "react";

import BirthdayData from "./BirthdayData";
import BirthdayGoal from "./BirthdayGoal";
import BirthdayHeader from "./BirthdayHeader";

import { useParams, redirect } from "next/navigation";

import Preloader from "@/app/ui/preloader/Loader";

import { ethers } from "ethers";
// import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";
import usersFacet from "@/app/abis/BOCUsersFacet.json";

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
  timeline: IBirthdayTimeline[];
}

interface IBirthdayTimeline {
  createdAt: bigint;
}

export default function Birthday() {
  const params = useParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [birthdayData, setBirthdayData] = useState<IBirthday | null>(null);
  const [error, setError] = useState<string>("");

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
      const user = await contract.getUser(params.address);
      return user;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch user details:", error);
        setError(error?.message || "Failed to fetch user details");
        redirect("/"); // when user does not exist, go back to the home page
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
      const birthday = await contract.getUserBirthdays(params.address);
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

  const updateBirthdayState = async () => {
    setLoading(false);
    const updatedBirthday = await getUserBirthday();
    setBirthdayData(updatedBirthday as IBirthday);
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
    <div className="h-auto w-11/12 md:w-1/2 mx-auto flex flex-col items-center justify-center space-y-5 pt-20">
      <BirthdayHeader data={userData as IUser} />

      <section className="h-auto w-full mx-auto flex justify-center items-center">
        <div className="h-full w-full rounded-md border border-gray-300 p-5 h-auto flex flex-col items-start justify-start space-y-10">
          {/* Birthday */}
          <BirthdayData
            data={userData as IUser}
            birthday={birthdayData as IBirthday}
            onDonate={async () => {
              await updateBirthdayState();
            }}
          />

          {/* Goals */}
          {birthdayData && Number(birthdayData.createdAt) > 0 ? (
            <BirthdayGoal
              userData={userData as IUser}
              goal={birthdayData.goal as IGoal}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
