"use client";

import { useState } from "react";

import clsx from "clsx";
import { poppins } from "@/app/fonts";

import { X } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { Button, Group, Modal, NumberInput, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";

import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { parseEther, formatEther, WalletClient } from "viem";
import birthdaysFacet from "@/../../artifacts/contracts/facets/BOCBirthdaysFacet.sol/BOCBirthdaysFacet.json";

import Goal from "./Goal";
import UpdateGoal from "./UpdateGoal";

interface EthersError {
  reason?: string;
  code?: string;
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

export default function ProfileBirthday({
  currency,
  birthday,
  onBirthdayChanged,
}: {
  currency: bigint;
  birthday: IBirthday;
  onBirthdayChanged: () => void;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const onGoalUpdatedDone = () => {
    onBirthdayChanged();
  };
  const onBirthdayCreated = () => {
    onBirthdayChanged();
    close();
  };

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
          Your Birthday Goal
        </h2>
      </header>

      {birthday && birthday.createdAt > 0 ? (
        Number(birthday.goal.createdAt) === 0 ? (
          <Goal birthdayId={Number(birthday.id)} />
        ) : (
          <div className="h-auto w-full flex flex-col items-start justiy-start">
            <div className="w-full flex items-center justify-between">
              <p className="text-[13px] font-medium text-gray-500">
                {birthday.goal.description}
              </p>
              <UpdateGoal
                onGoalUpdatedDone={onGoalUpdatedDone}
                goal={birthday.goal}
                birthdayId={Number(birthday.id)}
              />
            </div>
            {/* progress */}
            <div className="h-2 w-full rounded-full bg-gray-100 flex items-center justify-start overflow-hidden my-3">
              <div
                className={`h-full ${calculateWidthClass(
                  birthday.goal.targetAmount || BigInt(0),
                  birthday.goal.amountRaised || BigInt(0)
                )} bg-gradient-to-r from-orange-500 via-blue-500 to-pink-500 transition-all duration-700`}
              ></div>
            </div>
            {/* info */}
            <div className="w-full flex items-center justify-between">
              <div className="flex flex-col items-start justify-start">
                <p className="text-[10px] font-medium text-gray-500">Target</p>
                <p className="text-xs font-medium text-gray-800">
                  {currency === BigInt(0) ? "BOC" : "ETH"}&nbsp;
                  {formatEther(birthday.goal.targetAmount || BigInt(0))}
                </p>
              </div>

              <div className="flex flex-col items-start justify-end">
                <p className="text-[10px] font-medium text-gray-500">Raised</p>
                <p className="text-xs font-medium text-gray-800">
                  {currency === BigInt(0) ? "BOC" : "ETH"}&nbsp;
                  {formatEther(birthday.goal.amountRaised || BigInt(0))}
                </p>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="w-full h-auto flex flex-col items-center justify-center space-y-2">
          <h2
            className={clsx(
              poppins.className,
              "text-md font-medium text-center font-semibold capitalize"
            )}
          >
            You do not have a birthday!
          </h2>
          <p
            className={clsx(
              poppins.className,
              "w-8/12 md:w-7/12 text-xs text-gray-700 font-normal text-center"
            )}
          >
            Create your birthday and celebrate on chain.
          </p>

          <div
            onClick={open}
            className="cursor-pointer rounded-full py-2 px-4 flex items-center justify-center text-[12px] text-white font-medium bg-black"
          >
            Create Birthday
          </div>
        </div>
      )}

      {/* modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Create Birthday And Goal"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        transitionProps={{
          transition: "fade",
          duration: 600,
          timingFunction: "linear",
        }}
        closeButtonProps={{
          autoFocus: false,
          icon: <X size={20} />,
        }}
        size={"lg"}
        centered
      >
        {/* Modal content */}
        <BirthdayForm
          currency={currency}
          onBirthdayCreated={onBirthdayCreated}
        />
      </Modal>
    </div>
  );
}

type IAddress = `0x${string}`;

type IBirthdayData = {
  date: Date;
  description: string;
  targetAmount: number;
};

type IBirthdayPayload = {
  date: number;
  description: string;
  targetAmount: bigint;
};

const BirthdayForm = ({
  currency,
  onBirthdayCreated,
}: {
  currency: bigint;
  onBirthdayCreated: () => void;
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

  const createBirthday = async (birthdayData: IBirthdayPayload) => {
    try {
      if (!walletClient || !address) {
        throw new Error("Please connect your wallet first");
      }

      // Get the signer from connected wallet
      const signer = walletClientToSigner(walletClient);

      // Create contract instance with proper signer
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        birthdaysFacet.abi,
        await signer
      );

      await contract.createBirthdayAndGoal(
        birthdayData.date,
        birthdayData.description,
        birthdayData.targetAmount
      );

      setFormSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoading(false);

        if ((err as EthersError).reason) {
          console.log((err as EthersError).reason as string);
          setError((err as EthersError).reason as string);
        }
      } else {
        setError("Error: Failed to create birthday!");
        setLoading(false);
      }
    }
  };

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: birthdaysFacet.abi,
    eventName: "BirthdayCreated",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onBirthdayCreated();
      }
    },
  });

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      date: new Date(),
      description: "",
      targetAmount: 0,
    },

    validate: {
      date: (value) => (value ? null : "Please choose a date"),
      description: (value) =>
        value.length > 0 ? null : "Please type your goal",
      targetAmount: (value) => (value > 0 ? null : "Please type your amount"),
    },
  });

  const handleSubmit = (values: IBirthdayData) => {
    try {
      setLoading(true);
      const newBirthday = {
        ...values,
        date: values.date.setHours(0, 0, 0, 0),
        targetAmount: parseEther(String(values.targetAmount)),
      };
      createBirthday(newBirthday);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full h-auto flex flex-col items-center justify-center">
      {error ? (
        <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
          {error || "Failed to create birthday, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        <Group grow className="w-full" justify="space-between">
          <DateInput
            label="When is your birthday?"
            placeholder="Choose your date"
            key={form.key("date")}
            {...form.getInputProps("date")}
          />
        </Group>

        <Group grow className="w-full" justify="space-between" mt="md">
          <TextInput
            label="Describe your goal"
            placeholder="I want a PS5"
            key={form.key("description")}
            {...form.getInputProps("description")}
          />
        </Group>

        <Group grow className="w-full" justify="space-between" mt="md">
          <NumberInput
            prefix={currency === BigInt(0) ? "BOC " : "ETH "}
            allowNegative={false}
            min={1}
            max={10000}
            thousandSeparator=","
            label="How much do you need?"
            placeholder={`Maximum amount is ${
              currency === BigInt(0) ? "BOC" : "ETH"
            }-10000`}
            key={form.key("targetAmount")}
            {...form.getInputProps("targetAmount")}
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
                <span className="text-black text-xs">
                  Creating your birthday...
                </span>
                <div className="h-5 w-5 rounded-full border-[3px] border-gray-200 border-t-black animate-spin"></div>
              </div>
            ) : (
              "Submit"
            )}
          </Button>
        </Group>
      </form>
    </div>
  );
};
