"use client";

import { useState, useEffect } from "react";

import BirthdayMessage from "./BirthdayMessage";

import { Cake, AtSign, X } from "lucide-react";
import clsx from "clsx";
import { poppins } from "@/app/fonts";

import { useDisclosure } from "@mantine/hooks";
import { Button, Group, NumberInput, Modal, Select } from "@mantine/core";
import { useForm } from "@mantine/form";

import { formatCurrentDate } from "@/app/libs/utils/index";

import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { parseEther, WalletClient } from "viem";
// import bocToken from "@/../../artifacts/contracts/coin/BOCToken.sol/BOCTokenV1.json";
import bocToken from "@/app/abis/BOCTokenV1.json";
import activitiesFacet from "@/app/abis/BOCActivitiesFacet.json";
// import activitiesFacet from "@/../../artifacts/contracts/facets/BOCActivitiesFacet.sol/BOCActivitiesFacet.json";

interface EthersError {
  reason?: string;
  code?: string;
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

export default function BirthdayData({
  data,
  birthday,
  onDonate,
}: {
  data: IUser;
  birthday: IBirthday;
  onDonate: () => void;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const { isConnected } = useAccount();
  const [approving, setApproving] = useState<boolean>(false);
  const [subscribing, setSubscribing] = useState<boolean>(false);

  const onGiftSent = () => {
    onDonate();
    close();
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      <div className="w-full flex items-center justify-between pb-3 border-b border-gray-200">
        <header className="h-auto w-auto flex items-center justify-between">
          <h2 className={clsx(poppins.className, "w-full text-md font-medium")}>
            Profile
          </h2>
        </header>

        {isConnected ? (
          birthday && Number(birthday?.when) > 0 ? (
            <div className="flex items-center justify-center space-x-3">
              <div
                onClick={open}
                className="bg-purple-500 flex items-center rounded-full py-2 px-3 cursor-pointer justify-center text-[10px] text-white"
              >
                Send Gift
              </div>
              <BirthdayMessage userAddress={data?.uid} />
            </div>
          ) : null
        ) : (
          <p className="text-xs text-orange-500">Please connect your wallet!</p>
        )}
      </div>

      <div className="flex flex-col items-start justify-start space-y-2 w-full">
        <div className="flex items-center justify-start w-full space-x-2">
          <AtSign color="black" size={16} />
          <p
            className={clsx(
              poppins.className,
              "text-xs font-normal text-gray-600 mt-1"
            )}
          >
            {data?.nickname}
          </p>
        </div>

        {birthday && Number(birthday?.when) > 0 ? (
          <div className="flex items-center justify-start w-full space-x-2">
            <Cake color="black" size={16} />
            <p
              className={clsx(
                poppins.className,
                "text-xs font-normal text-gray-600 mt-1"
              )}
            >
              {formatCurrentDate(Number(birthday?.when))}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-start w-full space-x-2">
            <p
              className={clsx(
                poppins.className,
                "text-xs font-normal text-gray-600 mt-1"
              )}
            >
              No birthday found
            </p>
          </div>
        )}
      </div>

      {/* modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Gift Form"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        transitionProps={{ transition: "rotate-left" }}
        closeButtonProps={{
          autoFocus: false,
          icon: <X size={20} />,
        }}
        size={"sm"}
        centered
      >
        {/* Modal content */}
        <DonateForm
          userAddress={data?.uid}
          onGiftSent={onGiftSent}
          onApprove={(action: boolean) => setApproving(action)}
          onSubscribe={(action: boolean) => setSubscribing(action)}
          currency={data?.currency}
        />
      </Modal>

      {/* approving preloader */}
      {approving ? (
        <div className="h-full max-h-screen w-full bg-black/70 flex items-center justify-center backdrop-blur-sm absolute top-0 left-0 z-[10000]">
          <div className="h-auto w-80 flex flex-col space-y-4 rounded-lg bg-white relative p-7">
            <div className="flex flex-col items-center justify-center space-y-3">
              <h3 className="text-lg font-bold text-black">Grant Permission</h3>
              <p className="text-xs text-gray-700 font-normal text-center">
                Don&lsquo;t close or exit this window. Please continue
                connecting on your extension.
              </p>
              <div className="h-9 w-9 rounded-full border-2 boder-gray-50 border-t-orange-500 animate-spin"></div>
            </div>
          </div>
        </div>
      ) : null}

      {/* subscribing preloader */}
      {subscribing ? (
        <div className="h-full max-h-screen w-full bg-black/70 flex items-center justify-center backdrop-blur-sm absolute top-0 left-0 z-[10000]">
          <div className="h-auto w-80 flex flex-col space-y-4 rounded-lg bg-white relative p-7">
            <div className="flex flex-col items-center justify-center space-y-3">
              <h3 className="text-lg font-bold text-black">Sending Gift</h3>
              <p className="text-xs text-gray-700 font-normal text-center">
                Your gift is on the way...
              </p>
              <div className="h-9 w-9 rounded-full border-2 boder-gray-50 border-t-orange-500 animate-spin"></div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type IAddress = `0x${string}`;

const DonateForm = ({
  onGiftSent,
  userAddress,
  onApprove,
  onSubscribe,
  currency,
}: {
  onGiftSent: () => void;
  userAddress: string;
  currency: bigint | null;
  onApprove: (action: boolean) => void;
  onSubscribe: (action: boolean) => void;
}) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  const walletClientToSigner = (walletClient: WalletClient) => {
    const { account, chain, transport } = walletClient;
    const network = {
      chainId: chain?.id,
      name: chain?.name,
      ensAddress: chain?.contracts?.ensRegistry?.address,
    };
    const provider = new ethers.BrowserProvider(transport, network);
    const signer = provider.getSigner(account?.address);
    return signer;
  };

  const { data: walletClient } = useWalletClient();

  const sendGift = async (user: string, giftAmount: number) => {
    try {
      onSubscribe(true);

      if (!walletClient || !address) {
        throw new Error("Please connect your wallet first");
      }

      // Get the signer from connected wallet
      const signer = walletClientToSigner(walletClient);

      // Create contract instance with proper signer
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        activitiesFacet.abi,
        await signer
      );

      if (currency === BigInt(0)) {
        await contract.sendTokenAsGift(user, parseEther(String(giftAmount)));
      } else {
        await contract.sendEtherAsGift(user, {
          value: parseEther(String(giftAmount)),
        });
      }

      setFormSubmitted(true);
      onSubscribe(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoading(false);
        onSubscribe(false);

        if ((err as EthersError).reason) {
          console.log((err as EthersError).reason as string);
          setError((err as EthersError).reason as string);
        }
      } else {
        setError("Error: Failed to send gift!");
        setLoading(false);
        onSubscribe(false);
      }
    }
  };

  const approveTokenAllowance = async (amount: string | number) => {
    try {
      // check for selfish gifts
      if (userAddress === address) {
        setError("You can't send yourself a gift for now!");
        onApprove(false);
        setLoading(false);
        return;
      }

      onApprove(true);

      if (!walletClient || !address) {
        throw new Error("Please connect your wallet first");
      }

      // Get the signer from connected wallet
      const signer = walletClientToSigner(walletClient);

      // Create contract instance with proper signer
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS!,
        bocToken.abi,
        await signer
      );

      // check token balance
      const tokenBalance = await contract.balanceOf(address);

      if (tokenBalance < amount) {
        throw new Error("You do not have enough tokens for this transaction");
      }

      // check allowance
      const allowanceBefore = await contract.allowance(
        address,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      if (allowanceBefore >= amount) {
        onApprove(false);
        return;
      }

      await contract.approve(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        parseEther(String(amount)),
        {
          from: address,
        }
      );

      // check allowance
      const allowanceAfter = await contract.allowance(
        address,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      if (allowanceAfter < amount) {
        throw new Error(
          "You need to grant us permission to spend your BOC Token by approving our request in your extension"
        );
      }

      onApprove(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoading(false);
        onApprove(false);

        if ((err as EthersError).reason) {
          console.log((err as EthersError).reason as string);
          setError((err as EthersError).reason as string);
        } else {
          console.log(err);
          setError("Something went wrong, please try again later!");
        }
      } else {
        console.log(err);
        setError("Error: Failed to approve spending allowance!");
        setLoading(false);
        onApprove(false);
      }
    }
  };

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: activitiesFacet.abi,
    eventName: "GiftCreated",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onGiftSent();
      }
    },
  });

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      giftAmount: Number(""),
      currency: currency ? (currency === BigInt(0) ? "BOC" : "ETH") : "",
    },

    validate: {
      giftAmount: (value: number) =>
        value > 0 ? null : "Please type gift amount",
      currency: (value: string) =>
        value.length > 0 ? null : "Please select a currency",
    },
  });

  const handleSubmit = async (values: {
    giftAmount: number;
    currency: string;
  }) => {
    try {
      setLoading(true);
      const newGift = { ...values };

      if (newGift.currency === "BOC") {
        await approveTokenAllowance(newGift.giftAmount);
      }

      sendGift(userAddress, newGift.giftAmount);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (error) {
      setLoading(false);
      console.log(error);
    }
  }, [error]);

  return (
    <div className="w-full h-auto flex flex-col items-center justify-center">
      {error ? (
        <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
          {error || "Failed to send gift, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        {/* Currency */}
        <Group grow className="w-full" justify="space-between" mt="md">
          <Select
            label="Choose a currency?"
            placeholder="Currency"
            data={["BOC", "ETH"]}
            clearable
            key={form.key("currency")}
            {...form.getInputProps("currency")}
          />
        </Group>

        <Group grow className="w-full" justify="space-between" mt="md">
          <NumberInput
            prefix={`${currency === BigInt(0) ? "BOC " : "ETH "}`}
            allowNegative={false}
            min={1}
            max={10000}
            thousandSeparator=","
            label="How much do you want to gift?"
            placeholder={`1 ${currency === BigInt(0) ? "BOC" : "ETH"}`}
            key={form.key("giftAmount")}
            {...form.getInputProps("giftAmount")}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button
            disabled={loading}
            type="submit"
            variant="filled"
            color="orange"
            size="xs"
            radius="xl"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <span className="text-black text-xs">Sending gift...</span>
                <div className="h-5 w-5 rounded-full border-[3px] border-gray-200 border-t-black animate-spin"></div>
              </div>
            ) : (
              "Send Gift"
            )}
          </Button>
        </Group>
      </form>
    </div>
  );
};
