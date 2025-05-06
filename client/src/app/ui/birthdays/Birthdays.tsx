"use client";

import { useState, useEffect } from "react";

import BirthdayCard from "./BirthdayCard";
import BirthdayCardSearchResult from "./BirthdayCardSearchResult";
// import Pagination from "./Pagination"
import FeaturedBirthdays from "./FeaturedBirthdays";
import SearchForm from "./SearchForm";

import Preloader from "@/app/ui/preloader/Loader";

import { ethers } from "ethers";
import { useAccount } from "wagmi";
import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";

interface IEvent {
  user: string;
  when: string;
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

export default function Birthdays() {
  const { address, isConnected } = useAccount();
  const [searchResults, setSearchResults] = useState<ISearchResult | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<IEvent[] | ethers.Result[] | null>(null);

  const filterUsers = (logs: ethers.EventLog[]) => {
    if (isConnected) {
      return logs.map((log) => log.args).filter((log) => log.user !== address);
    } else {
      return logs.map((log) => log.args);
    }
  };

  let contract: ethers.Contract | null = null;

  const getCompleteUsers = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        usersFacet.abi,
        provider
      );

      // Create a filter for the event
      const filter = contract.filters.UserCreated();

      // Query for past events
      const logs: (ethers.Log | ethers.EventLog)[] = await contract.queryFilter(
        filter,
        0,
        "latest"
      );

      setUsers(filterUsers(logs as ethers.EventLog[]));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getCompleteUsers();

    return () => {
      if (contract) {
        contract.removeAllListeners("UserCreated");
      }
    };
  }, []);

  useEffect(() => {}, [users]);

  if (loading) {
    return <Preloader />;
  }

  return (
    <section className="h-auto w-full overflow-x-hidden overflow-y-auto mt-12">
      {/* Featured Birthdays */}
      <FeaturedBirthdays />

      {/* SearchForm */}
      <SearchForm
        onSearchDone={(searchResult) => {
          setSearchResults(searchResult);
        }}
        onClearSearch={() => {
          setSearchResults(null);
          getCompleteUsers();
        }}
      />

      {/* Gallery */}
      <section className="h-auto w-full md:w-11/12 mx-auto p-5 grid grid-cols-1 md:grid-cols-4 gap-5">
        {users && users.length > 0 ? (
          searchResults ? (
            <BirthdayCardSearchResult
              userData={searchResults?.userData}
              birthdayData={searchResults?.birthdayData}
            />
          ) : (
            users.map((user, i) => {
              return <BirthdayCard key={i} event={user} />;
            })
          )
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-1 md:col-span-4">
            <h2 className="texxt-xl font-medium text-gray-700 capitalize">
              Nobody is here yet!
            </h2>
            <p className="text-sm text-gray-600 font-normal text-center w-9/12 md:w-7/12">
              You are the first to get here, do the honours of creating an
              account.
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {/* <Pagination /> */}
    </section>
  );
}
