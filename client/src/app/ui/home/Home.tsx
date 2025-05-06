"use client";

import { useState, useEffect } from "react";

import Preloader from "@/app/ui/preloader/Loader";

//deps
import Image from "next/image";
import Link from "next/link";

import { poppins } from "@/app/fonts";
import { Cake, Route, Heart } from "lucide-react";

import { formatNumber } from "@/app/libs/utils/index";
import { ethers } from "ethers";
import birthdaysFacet from "@/../../artifacts/contracts/facets/BOCBirthdaysFacet.sol/BOCBirthdaysFacet.json";

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [totalOnChain, setTotalOnChain] = useState<number>(0);
  const [happeningNow, setHappeningNow] = useState<number>(0);
  const [comingSoon, setComingSoon] = useState<number>(0);

  const isSameDayOfYear = (date1: Date, date2: Date) => {
    return (
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const sortHappeningNow = (bdays: ethers.EventLog[]) => {
    let total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = bdays.map(
      (bday: ethers.EventLog) => bday && bday?.args?.when
    );

    dates.forEach((bday) => {
      const birthdayDate = new Date(Number(bday));
      birthdayDate.setHours(0, 0, 0, 0);

      if (isSameDayOfYear(today, birthdayDate)) {
        total++;
      }
    });

    return total;
  };

  const sortComingSoon = (bdays: ethers.EventLog[]) => {
    let total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dates = bdays.map(
      (bday: ethers.EventLog) => bday && bday?.args?.when
    );
    dates.forEach((bday) => {
      const birthdayDate = new Date(Number(bday));
      birthdayDate.setHours(0, 0, 0, 0);
      if (isSameDayOfYear(tomorrow, birthdayDate)) {
        total++;
      }
    });
    return total;
  };

  useEffect(() => {
    let contract: ethers.Contract | null = null;

    const getBirthdays = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_JSON_RPC_URL
        );
        contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
          birthdaysFacet.abi,
          provider
        );

        // Create a filter for the event
        const filter = contract.filters.BirthdayCreated();

        // Query for past events
        const logs: (ethers.Log | ethers.EventLog)[] =
          await contract.queryFilter(filter, 0, "latest");

        setTotalOnChain(logs.length);
        setHappeningNow(sortHappeningNow(logs as ethers.EventLog[]));
        setComingSoon(sortComingSoon(logs as ethers.EventLog[]));
      } catch (error) {
        console.error("Error fetching birthdays: ", error);
      } finally {
        setLoading(false);
      }
    };

    getBirthdays();

    return () => {
      if (contract) {
        contract.removeAllListeners("BirthdayCreated");
      }
    };
  }, []);

  return (
    <section className="h-auto w-full overflow-hidden mt-5 md:mt-12">
      {/* Hero */}
      <section className="h-auto w-11/12 max-w-[1366px] mx-auto flex flex-col md:flex-row space-y-7 md:space-y-0 items-center justify-center">
        <div className="w-full md:w-1/2 flex flex-col items-start justify-start space-y-8">
          <h2
            className={`text-6xl md:text-8xl text-center md:text-left font-bold uppercase ${poppins.className}`}
          >
            Celebrate on-
            <span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-orange-500">
              <span className="relative text-white dark:text-gray-950">
                Chain
              </span>
            </span>
          </h2>
          <p
            className={`w-11/12 md:w-full mx-auto text-2xl md:text-4xl font-bold text-center md:text-left uppercase leading-tight ${poppins.className}`}
          >
            Suprise your <span className="text-pink-500">loved&nbsp;</span>
            ones on their <span className="text-blue-500">Birthday</span>
          </p>

          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-5">
            <div className="w-full flex flex-col items-center md:items-start justify-center space-y-2">
              <p
                className={`text-xs text-gray-800 font-normal ${poppins.className}`}
              >
                Total On-Chain
              </p>
              <h3 className={`text-5xl font-bold ${poppins.className}`}>
                {formatNumber(totalOnChain)}
              </h3>
            </div>

            <div className="w-full flex flex-col items-center md:items-start justify-center space-y-2">
              <p
                className={`text-xs text-gray-800 font-normal ${poppins.className}`}
              >
                Happening Now
              </p>
              <h3 className={`text-5xl font-bold ${poppins.className}`}>
                {formatNumber(happeningNow)}
              </h3>
            </div>

            <div className="w-full flex flex-col items-center md:items-start justify-center space-y-2 col-span-2 md:col-span-1">
              <p
                className={`text-xs text-gray-800 font-normal ${poppins.className}`}
              >
                Coming Soon
              </p>
              <h3 className={`text-5xl font-bold ${poppins.className}`}>
                {formatNumber(comingSoon)}
              </h3>
            </div>
          </div>

          {/* buttons */}
          <div className="flex space-x-4 items-center">
            <Link
              href="/birthdays"
              className="rounded-md bg-black flex space-x-3 items-center justify-center text-white font-normal text-sm px-5 py-3 cursor-pointer"
            >
              <span>Give a surprise</span>
              <Cake color="white" size={20} />
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-md bg-transparent flex space-x-3 items-center justify-center text-orange-500 border border-orange-500 font-normal text-sm px-5 py-3 cursor-pointer"
            >
              <span>How it works</span>
              <Route color="orange" size={20} />
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="relative h-[22rem] md:h-[30rem] w-full md:w-10/12 flex items-center justify-center p-5">
            <Image
              src="/assets/images/fun-3d-horse-illustration-with-cake.png"
              alt="3d Horse Holding Cake"
              fill
              priority={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* Donate */}
      <div className={"w-full flex items-center space-x-3 justify-end px-5"}>
        <p className="w-full flex items-center space-x-3 justify-end text-xs text-gray-400 ">
          <span
            className={`font-medium text-black antialiased ${poppins.className}`}
          >
            Donate:
          </span>
          <Heart color="red" size={18} />
          <Link
            target="_blank"
            href={`https://sepolia.etherscan.io/address/0x81DaE58150D62bfC27f6F1955975392FB8C12408`}
            className={`font-medium text-blue-500 antialiased ${poppins.className}`}
          >
            {`${"0x81DaE58150D62bfC27f6F1955975392FB8C12408".substring(
              0,
              6
            )}...${"0x81DaE58150D62bfC27f6F1955975392FB8C12408".substring(35)}`}
          </Link>
        </p>
      </div>

      {/* preloader */}
      {loading ? <Preloader /> : null}
    </section>
  );
}
