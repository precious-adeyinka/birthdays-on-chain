"use client";

import { useState } from "react";

import clsx from "clsx";
import { poppins } from "@/app/fonts";

import { Button, Group, TextInput, Select } from "@mantine/core";
import { useForm } from "@mantine/form";

import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { WalletClient } from "viem";
import usersFacet from "@/app/abis/BOCUsersFacet.json";
// import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";

import AvatarPicker from "./AvatarPicker";

export default function NewAccountForm({
  onAccountCreated,
}: {
  onAccountCreated: () => void;
}) {
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <div className="px-5 py-10 md:p-10 flex flex-col items-center justify-center w-full h-auto space-y-2">
      {showModal ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <h2
            className={clsx(
              poppins.className,
              "text-2xl font-medium text-center font-semibold"
            )}
          >
            Create Your Birthday Account
          </h2>

          <p
            className={clsx(
              poppins.className,
              "w-10/12 md:w-7/12 text-sm text-gray-700 font-normal text-center"
            )}
          >
            This is a one time step and will grant you access to a lot of cool
            features!
          </p>

          <div
            onClick={() => setShowModal(false)}
            className="cursor-pointer rounded-full px-4 py-2 flex items-center justify-center text-xs text-white font-medium bg-red-500"
          >
            Cancel
          </div>

          <UpdateForm onAccountCreated={onAccountCreated} />
        </div>
      ) : (
        <div className="w-full h-auto flex flex-col items-center justify-center space-y-3">
          <h2
            className={clsx(
              poppins.className,
              "text-2xl md:text-3xl font-medium text-center font-semibold"
            )}
          >
            You do not have an account!
          </h2>
          <p
            className={clsx(
              poppins.className,
              "w-8/12 md:w-7/12 text-sm md:text-md text-gray-700 font-normal text-center"
            )}
          >
            Create your account on chain now and start celebrating this year
          </p>
          <div
            onClick={() => setShowModal(true)}
            className="cursor-pointer rounded-full py-2 px-4 flex items-center justify-center text-sm text-white font-medium bg-orange-500"
          >
            Create Account
          </div>
        </div>
      )}
    </div>
  );
}

interface EthersError {
  reason?: string;
  code?: string;
}

interface IAccountForm {
  fullname: string;
  nickname: string;
  gender: string;
  photo: string;
  currency: string;
}

type IAddress = `0x${string}`;

const UpdateForm = ({ onAccountCreated }: { onAccountCreated: () => void }) => {
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

  const createNewUser = async (user: IAccountForm) => {
    try {
      if (!walletClient || !address) {
        throw new Error("Please connect your wallet first");
      }

      // Get the signer from connected wallet
      const signer = walletClientToSigner(walletClient);

      // Create contract instance with proper signer
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        usersFacet.abi,
        await signer
      );

      await contract.createUser(
        user.fullname,
        user.nickname,
        user.gender,
        user.currency.toLowerCase() === "boc" ? BigInt(0) : BigInt(1),
        user.photo
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
          setError(
            err?.message || "Something went wrong, please try again later!"
          );
        }
      } else {
        console.log(err);
        setError("Error: Failed to create user!");
        setLoading(false);
      }
    }
  };

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: usersFacet.abi,
    eventName: "UserCreated",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onAccountCreated();
      }
    },
  });

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      fullname: "",
      nickname: "",
      gender: "",
      photo: "",
      currency: "",
    },

    validate: {
      fullname: (value) => (value.length > 0 ? null : "Please type your name"),
      nickname: (value) =>
        value.length > 0 ? null : "Please type your nickname",
      gender: (value) =>
        value.length > 0 ? null : "Please choose your gender",
      photo: (value) => (value.length > 0 ? null : "Please select a photo"),
      currency: (value) =>
        value.length > 0 ? null : "Please select a currency",
    },
  });

  const handleSubmit = (values: IAccountForm) => {
    try {
      setLoading(true);
      const newUser = { ...values };
      createNewUser(newUser);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full mx-auto md:w-full h-auto pt-5">
      {error ? (
        <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
          {error || "Failed to create user, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full mt-1">
        {/* Fullname & Nickname */}
        <Group grow className="w-full" justify="space-between">
          <TextInput
            label="What are you called?"
            placeholder="Your Full Name"
            key={form.key("fullname")}
            {...form.getInputProps("fullname")}
          />

          <TextInput
            label="Got a nickname?"
            placeholder="Your Nickname"
            key={form.key("nickname")}
            {...form.getInputProps("nickname")}
          />
        </Group>

        {/* Gender */}
        <Group grow className="w-full" justify="space-between" mt="md">
          <Select
            label="What is your gender?"
            placeholder="Gender"
            data={["Male", "Female"]}
            clearable
            key={form.key("gender")}
            {...form.getInputProps("gender")}
          />
        </Group>

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

        {/* Photo */}
        <Group grow className="w-full" justify="space-between" mt="md">
          <AvatarPicker
            isError={form.getValues().photo.length === 0}
            onAvatarChanged={(avatar: string) =>
              form.setValues({ photo: avatar })
            }
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
                  Creating your account...
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
