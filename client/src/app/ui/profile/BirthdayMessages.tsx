"use client";

import { useState, useEffect } from "react";

import { poppins } from "@/app/fonts";
import clsx from "clsx";
import Link from "next/link";

import { Rabbit } from "lucide-react";

import Preloader from "@/app/ui/preloader/Loader";

import { ethers } from "ethers";
import { useAccount } from "wagmi";
import usersFacet from "@/app/abis/BOCUsersFacet.json";
// import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json"
import { formatBirthday } from "@/app/libs/utils";

interface IUserMessage {
  id: bigint;
  createdAt: bigint;
  sender: string;
  recipient: string;
  message: string;
}

export default function BirthdayMessages() {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [messages, setMessages] = useState<IUserMessage[] | null>(null);

  // Fetch user messages
  const fetchUserMessages = async () => {
    try {
      const provider = await new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        usersFacet.abi,
        provider
      );
      const result = await contract.getUserMessages(address);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        console.log(error?.message || "Something went wrong");
        setError(error?.message || "Something went wrong");
      }
      console.log(error);
      return null;
    }
  };

  useEffect(() => {
    fetchUserMessages().then((userMessages) => {
      if (userMessages.length > 0) {
        setMessages(userMessages);
        setLoading(false);
      } else {
        setMessages(null);
        setLoading(false);
      }
    });

    if (error) {
      setLoading(false);
      console.log("MESSAGE ERROR: ", error);
    }
  }, []);

  // // Handle data streaming
  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="w-full p-5 flex flex-col items-start justify-start space-y-3 divide-y divide-gray-100">
      {messages && messages?.length > 0 ? (
        messages.map((message, i) => {
          return <BirthdayMessage data={message} key={i} />;
        })
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-1">
          <Rabbit color="gray" size="60" />
          <h2 className="texxt-xl font-medium text-gray-700 capitalize">
            Your message is empty
          </h2>
          <p className="text-sm text-gray-600 font-light text-center w-11/12 md:w-7/12">
            Birthday wishes will appear here when you start receiving messages
            from loved ones.
          </p>
        </div>
      )}
    </div>
  );
}

const BirthdayMessage = ({ data }: { data: IUserMessage }) => {
  return (
    <div className="w-full flex justify-between items-center pb-3">
      <div className="w-auto flex flex-col items-start justify-start space-y-1">
        <Link
          target="_blank"
          href={`https://sepolia.etherscan.io/address/${data?.sender}`}
          className={clsx(
            poppins.className,
            "font-medium text-blue-500 antialiased text-xs text-blue-700 font-normal"
          )}
        >{`${data?.sender.substring(0, 6)}...${data?.sender.substring(
          35
        )}`}</Link>
        <p className="text-sm font-medium text-black">{data?.message}</p>
      </div>
      <p className="text-xs text-gray-400">
        {formatBirthday(Number(data?.createdAt))}
      </p>
    </div>
  );
};
