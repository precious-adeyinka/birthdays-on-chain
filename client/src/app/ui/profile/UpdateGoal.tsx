"use client";

import { useState } from "react";

import { X } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { Button, Group, Modal, TextInput, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";

import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { WalletClient } from "viem";
import birthdaysFacet from "@/app/abis/BOCBirthdaysFacet.json";
// import birthdaysFacet from "@/../../artifacts/contracts/facets/BOCBirthdaysFacet.sol/BOCBirthdaysFacet.json"
import { formatEther, parseEther } from "viem";

interface EthersError {
  reason?: string;
  code?: string;
}

interface IGoal {
  description: string;
  targetAmount: number;
}

interface Goal {
  createdAt: bigint;
  description: string;
  targetAmount: bigint;
  amountRaised?: bigint;
}

export default function UpdateGoal({
  birthdayId,
  goal,
  onGoalUpdatedDone,
}: {
  birthdayId: number;
  goal: Goal;
  onGoalUpdatedDone: () => void;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const onGoalUpdated = () => {
    onGoalUpdatedDone();
    close();
  };

  return (
    <div>
      <div
        onClick={open}
        className="bg-black flex items-center rounded-full py-1 px-3 cursor-pointer justify-center text-[10px] text-white"
      >
        Update
      </div>

      {/* modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Update Goal"
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
        <GoalUpdateForm
          goal={goal}
          birthdayId={birthdayId}
          onGoalUpdated={onGoalUpdated}
        />
      </Modal>
    </div>
  );
}

type IAddress = `0x${string}`;

const GoalUpdateForm = ({
  birthdayId,
  onGoalUpdated,
  goal,
}: {
  birthdayId: number;
  onGoalUpdated: () => void;
  goal: Goal;
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

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: birthdaysFacet.abi,
    eventName: "GoalUpdated",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onGoalUpdated();
      }
    },
  });

  const updateGoal = async (goal: IGoal) => {
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

      await contract.updateGoal(
        birthdayId,
        goal.description,
        parseEther(String(goal.targetAmount))
      );

      setFormSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoading(false);

        if ((err as EthersError).reason) {
          console.log((err as EthersError).reason as string);
          setError((err as EthersError).reason as string);
        } else {
          console.log(err);
          setError("Something went wrong, please try again later!");
        }
      } else {
        console.log(err);
        setError("Error: Failed to create user!");
        setLoading(false);
      }
    }
  };

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      description: goal?.description || "",
      targetAmount: Number(formatEther(goal?.targetAmount)) || 0,
    },

    validate: {
      description: (value) =>
        value.length > 0 ? null : "Please type your goal",
      targetAmount: (value) => (value > 0 ? null : "Please type your amount"),
    },
  });

  const handleSubmit = (values: IGoal) => {
    try {
      setLoading(true);
      const updatedGoal = { ...values };
      updateGoal(updatedGoal);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full h-auto">
      {error ? (
        <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
          {error || "Failed to update goal, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        <Group grow className="w-full" justify="space-between">
          <TextInput
            label="Describe your goal"
            placeholder="I want a PS5"
            key={form.key("description")}
            {...form.getInputProps("description")}
          />
        </Group>

        <Group grow className="w-full" justify="space-between" mt="md">
          <NumberInput
            prefix="$"
            allowNegative={false}
            min={1}
            max={10000}
            thousandSeparator=","
            label="How much do you need?"
            placeholder="Maximum amount is $10000"
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
                  Updating your goal...
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
