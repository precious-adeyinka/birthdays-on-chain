"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";

import ProfileData from "./ProfileData";
import ProfileBirthday from "./ProfileBirthday";
import ProfileHeader from "./ProfileHeader";
import ProfileActivities from "./ProfileActivities";
import NewAccountForm from "./NewAccountForm";

import Preloader from "@/app/ui/preloader/Loader";

import { ethers } from "ethers";
import { useAccount } from "wagmi";
import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";

import Pride from "react-canvas-confetti/dist/presets/pride";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";

interface IUser {
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
  amountRaised: bigint;
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

export default function Profile() {
  // const router = useRouter();
  const { isConnected, address } = useAccount();
  const [loading, setLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [etherBalance, setEtherBalance] = useState<bigint>(BigInt(0));
  const [bocBalance, setBocBalance] = useState<bigint>(BigInt(0));
  const [birthday, setBirthday] = useState<IBirthday | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean>(false);

  // confettis
  const [accountCreatedConfetti, setAccountCreatedConfetti] =
    useState<boolean>(false);
  const [birthdayCreatedConfetti, setBirthdayCreatedConfetti] =
    useState<boolean>(false);
  const [withdrawalCreatedConfetti, setWithdrawalCreatedConfetti] =
    useState<boolean>(false);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const provider = await new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        usersFacet.abi,
        provider
      );

      const user = await contract.getUser(address);
      const balance = await contract.getUserBalance(address);
      const tokenBalance = await contract.getUserTokenBalance(address);
      const birthday = await contract.getUserBirthdays(address);

      setUser(user);
      setEtherBalance(balance);
      setBocBalance(tokenBalance);
      setBirthday(birthday);

      setHasAccount(user?.isActive || false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // setError("Something went wrong while fetching your profile data.");
    } finally {
      setLoading(false);
    }
  };

  // Setup profile based on connection status
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      setTimeout(() => {
        setLoading(false);
      }, 5000); // allow 5 seconds for reconnection
    }
  }, [isConnected, address]);

  if (loading) {
    return <Preloader />;
  }

  if (!hasAccount && !loading) {
    return (
      <NewAccountForm
        onAccountCreated={async () => {
          await fetchUserData();
          setAccountCreatedConfetti(true);
          setTimeout(() => setAccountCreatedConfetti(false), 5000);
        }}
      />
    );
  }

  return (
    <div className="h-auto w-full flex flex-col items-center justify-center space-y-5 pt-16 pb-5 md:pb-0">
      <ProfileHeader
        data={user!}
        bocBalance={bocBalance}
        etherBalance={etherBalance}
        onEtherWithdrawn={async () => {
          await fetchUserData();
          setWithdrawalCreatedConfetti(true);
          setTimeout(() => setWithdrawalCreatedConfetti(false), 5000);
        }}
        onBocWithdrawn={async () => {
          await fetchUserData();
          setWithdrawalCreatedConfetti(true);
          setTimeout(() => setWithdrawalCreatedConfetti(false), 5000);
        }}
      />

      <section className="h-auto md:h-[23rem] w-11/12 mx-auto flex flex-col md:flex-row justify-between space-y-5 md:space-x-5">
        <div className="h-full w-full md:w-1/2 rounded-md border border-gray-300 p-5 flex flex-col items-start justify-start space-y-10">
          {/* profile */}
          <ProfileData
            user={user!}
            birthday={birthday!}
            onBirthdayChanged={async () => await fetchUserData()}
          />

          {/* goals */}
          <ProfileBirthday
            currency={user?.currency as bigint}
            onBirthdayChanged={async () => {
              await fetchUserData();
              setBirthdayCreatedConfetti(true);
              setTimeout(() => setBirthdayCreatedConfetti(false), 5000);
            }}
            birthday={birthday!}
          />
        </div>

        <ProfileActivities 
        user={user!}
        birthday={birthday!} />
      </section>

      {/* Confettti animations */}
      {accountCreatedConfetti && <Pride autorun={{ speed: 3 }} />}
      {birthdayCreatedConfetti && <Fireworks autorun={{ speed: 3 }} />}
      {withdrawalCreatedConfetti && <Pride autorun={{ speed: 3 }} />}
    </div>
  );
}
