"use client";

import { useState } from "react";

import { Cake, AtSign, X } from "lucide-react";
import clsx from "clsx";
import { poppins } from "@/app/fonts";

import { useDisclosure } from "@mantine/hooks";
import { Button, Group, TextInput, Modal, Select } from "@mantine/core";
import { useForm } from "@mantine/form";

import { formatCurrentDate } from "@/app/libs/utils/index";
import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { WalletClient } from "viem";
import usersFacet from "@/app/abis/BOCUsersFacet.json";
// import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";

import AvatarPicker from "./AvatarPicker";

import { CopyButton, Tooltip } from "@mantine/core";
import { IconCopy, IconCheck } from "@tabler/icons-react";

interface EthersError {
  reason?: string;
  code?: string;
}

interface IUser {
  fullname: string;
  nickname: string;
  gender: string;
  photo: string;
  currency: bigint;
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

export default function ProfileData({
  user,
  birthday,
  onBirthdayChanged,
}: {
  user: IUser;
  birthday: IBirthday;
  onBirthdayChanged: () => void;
}) {
  const { address } = useAccount();
  const [opened, { open, close }] = useDisclosure(false);

  const onUserUpdated = () => {
    onBirthdayChanged();
    close();
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      <div className="w-full flex items-center justify-between pb-3 border-b border-gray-200">
        <header className="h-auto w-auto flex items-center justify-between">
          <h2 className={clsx(poppins.className, "w-full text-md font-medium")}>
            Profile
          </h2>
        </header>

        <div className="flex items-center justify-end space-x-2 w-auto h-auto">
          <div
            onClick={open}
            className="bg-black flex items-center rounded-full py-1 px-3 cursor-pointer justify-center text-[10px] text-white"
          >
            Update
          </div>

          <CopyButton
            value={`${process.env.NEXT_PUBLIC_APP_URL}/birthday/${address}`}
            timeout={2000}
          >
            {({ copied, copy }) => (
              <Tooltip
                label={copied ? "Copied" : "Copy url"}
                withArrow
                position="right"
              >
                <div
                  onClick={copy}
                  className={clsx(
                    "flex items-center space-x-2 rounded-full py-1 px-3 cursor-pointer justify-center text-[10px] text-white",
                    {
                      "bg-green-500": copied,
                      "bg-blue-500": !copied,
                    }
                  )}
                >
                  <span>
                    {copied ? "Copied url" : "share your birthday page"}
                  </span>

                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </div>
              </Tooltip>
            )}
          </CopyButton>
        </div>
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
            {user?.nickname}
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
            <Cake color="black" size={16} />
            <p
              className={clsx(
                poppins.className,
                "text-xs font-normal text-gray-600 mt-1"
              )}
            >
              No Birthday Found
            </p>
          </div>
        )}
      </div>

      {/* modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Update Profile"
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
        <UpdateForm user={user} onUserUpdated={onUserUpdated} />
      </Modal>
    </div>
  );
}

interface IAccountForm {
  fullname: string;
  nickname: string;
  avatar: string;
  currency: string;
}

type IAddress = `0x${string}`;

const UpdateForm = ({
  user,
  onUserUpdated,
}: {
  onUserUpdated: () => void;
  user: IUser;
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

  const updateUser = async (user: IAccountForm) => {
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

      await contract.updateUser(
        user.fullname,
        user.nickname,
        user.currency.toLowerCase() === "boc" ? BigInt(0) : BigInt(1),
        user.avatar
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
        setError("Error: Failed to update user!");
        setLoading(false);
      }
    }
  };

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: usersFacet.abi,
    eventName: "UpdateUser",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onUserUpdated();
      }
    },
  });

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      fullname: user?.fullname || "",
      nickname: user?.nickname || "",
      avatar: user?.photo || "",
      currency: user?.currency
        ? user.currency === BigInt(0)
          ? "BOC"
          : "ETH"
        : "",
    },

    validate: {
      fullname: (value) => (value.length > 0 ? null : "Please type your name"),
      nickname: (value) =>
        value.length > 0 ? null : "Please type your nickname",
      avatar: (value) => (value.length > 0 ? null : "Please choose an avatar"),
      currency: (value) =>
        value.length > 0 ? null : "Please choose a currency",
    },
  });

  const handleSubmit = (values: IAccountForm) => {
    try {
      setLoading(true);
      const newUser = { ...values };
      updateUser(newUser);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full h-auto pt-5">
      {error ? (
        <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
          {error || "Failed to update user, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        <Group grow className="w-full" justify="space-between">
          <TextInput
            label="What are you called?"
            placeholder="John Chad"
            key={form.key("fullname")}
            {...form.getInputProps("fullname")}
          />

          <TextInput
            label="Got a nickname?"
            placeholder="Chad"
            key={form.key("nickname")}
            {...form.getInputProps("nickname")}
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

        <Group grow className="w-full" justify="space-between" mt="md">
          <AvatarPicker
            hasAvatar={form.getValues().avatar}
            isError={form.getValues().avatar.length === 0}
            onAvatarChanged={(avatar: string) => form.setValues({ avatar })}
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
                  Updating your account...
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
