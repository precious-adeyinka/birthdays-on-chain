"use client";

import { useState, useEffect, ChangeEventHandler } from "react";

//deps
import clsx from "clsx";
import { poppins } from "@/app/fonts";
import { Search } from "lucide-react";

import { ethers } from "ethers";
import platformFacets from "@/app/abis/BOCPlatformFacet.json";
// import platformFacets from "@/../../artifacts/contracts/facets/BOCPlatformFacet.sol/BOCPlatformFacet.json";
import { zeroAddress } from "viem";

interface EthersError {
  reason?: string;
  code?: string;
}

interface ISearchResult {
  userData: IUser;
  birthdayData: IBirthday;
}

interface IUser {
  uid: string;
  fullname: string;
  nickname: string;
  gender: string;
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
}

export default function SearchForm({
  onClearSearch,
  onSearchDone,
}: {
  onClearSearch: () => void;
  onSearchDone: (searchResult: ISearchResult | null) => void;
}) {
  const [userAddress, setUserAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUserAddress: ChangeEventHandler<HTMLInputElement> = (e) =>
    setUserAddress(e.target.value);

  const findUser = async () => {
    if (validateUser()) {
      setLoading(true);
      setError(null);

      try {
        const provider = await new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_JSON_RPC_URL
        );
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
          platformFacets.abi,
          provider
        );
        const result = await contract.getCompleteUser(userAddress);

        if (result && result.user.uid === zeroAddress) {
          setError("User not found");
        } else {
          onSearchDone({
            userData: result.user,
            birthdayData: result.birthdays,
          });
          setError(null);
        }
        setLoading(false);
      } catch (err: unknown) {
        console.log(err);
        setError("Invalid address");

        if (err instanceof Error) {
          setLoading(false);

          if ((err as EthersError).reason) {
            console.log((err as EthersError).reason as string);
            setError((err as EthersError).reason as string);
          }
        } else {
          setError("Error: Failed to search!");
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
      console.log("Validation failed!");
    }
  };

  const validateUser = () => {
    if (!userAddress && userAddress.length === 0) {
      setError("Please type wallet address");
      return false;
    }
    return true;
  };

  const clearSearch = () => {
    onClearSearch();
  };

  useEffect(() => {
    if (userAddress.length === 0) {
      clearSearch();
    }
  }, [userAddress]);

  return (
    <section className="h-auto w-full md:w-11/12 mx-auto flex flex-col items-center justify-center mt-12 p-5">
      <h2
        className={clsx(
          poppins.className,
          "text-3xl md:text-5xl text-center font-semibold text-black"
        )}
      >
        Find Your Birthday
      </h2>
      <p
        className={clsx(
          poppins.className,
          "w-10/12 md:w-full text-md text-center text-gray-700 mt-2 font-normal"
        )}
      >
        Query the blockchain for your birthday data or your loved ones.
      </p>

      <form className="h-auto w-full md:w-1/2 mx-auto flex flex-col space-y-2 items-center justify-center mt-8">
        {error ? (
          <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
            {error || "You broke it!, kidding, please try again"}
          </div>
        ) : null}

        <div className="h-12 w-full flex items-center justify-center border border-gray-300 rounded-full relative">
          <Search
            size="20"
            className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400"
          />
          <input
            value={userAddress}
            onChange={handleUserAddress}
            placeholder="Type your address"
            type="text"
            className="h-full w-full focus:outline-none text-[12px] font-normal p-2 pl-10 placeholder:text-xs placeholder:text-gray-400 text-gray-800"
          />
          <div
            onClick={findUser}
            className={clsx(
              "h-full px-5 rounded-full flex items-center text-white text-xs cursor-pointer font-medium",
              {
                "pointer-events-none cursor-not-allowed bg-gray-400": loading,
                "pointer-events-auto cursor-pointer bg-orange-500": !loading,
              }
            )}
          >
            {loading ? "searching..." : "Find"}
          </div>
        </div>
      </form>
    </section>
  );
}
