"use client";

import { useState, useEffect } from "react";

import { X } from "lucide-react";

import { useDisclosure } from "@mantine/hooks";
import { Button, Group, TextInput, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";

import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { WalletClient } from "viem";
import activitiesFacet from "@/../../artifacts/contracts/facets/BOCActivitiesFacet.sol/BOCActivitiesFacet.json";

interface EthersError {
  reason?: string;
  code?: string;
}

export default function BirthdayMessage({
  userAddress,
}: {
  userAddress: string;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const onMessageSent = () => {
    close();
    setMessageCreatedConfetti(true);
    setTimeout(() => {
      setMessageCreatedConfetti(false);
    }, 10000);
  };

  return (
    <div className="w-auto flex space-y-5">
      <div
        onClick={open}
        className="bg-blue-500 flex items-center rounded-full py-2 px-3 cursor-pointer justify-center text-[10px] text-white"
      >
        Send Message
      </div>

      {/* modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Message Form"
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
        <MessageForm userAddress={userAddress} onMessageSent={onMessageSent} />
      </Modal>
    </div>
  );
}

type IAddress = `0x${string}`;

const MessageForm = ({
  onMessageSent,
  userAddress,
}: {
  onMessageSent: () => void;
  userAddress: string;
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

  const sendMessage = async (user: string, wish: string) => {
    try {
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

      await contract.sendMessage(user, wish);

      setFormSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoading(false);

        if ((err as EthersError).reason) {
          console.log((err as EthersError).reason as string);
          setError((err as EthersError).reason as string);
        }
      } else {
        setError("Error: Failed to send message!");
        setLoading(false);
      }
    }
  };

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: activitiesFacet.abi,
    eventName: "MessageCreated",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onMessageSent();
      }
    },
  });

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      wish: "",
    },

    validate: {
      wish: (value: string) =>
        value.length > 0 ? null : "Please type your message",
    },
  });

  const handleSubmit = (values: { wish: string }) => {
    try {
      setLoading(true);
      const newMessage = { ...values };
      sendMessage(userAddress, newMessage.wish);
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
          {error || "Failed to send message, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        <Group grow className="w-full" justify="space-between" mt="md">
          <TextInput
            label="Send your wish"
            placeholder="I hope your day is filled with love friend"
            key={form.key("wish")}
            {...form.getInputProps("wish")}
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
                <span className="text-black text-xs">Sending message...</span>
                <div className="h-5 w-5 rounded-full border-[3px] border-gray-200 border-t-black animate-spin"></div>
              </div>
            ) : (
              "Send Wish"
            )}
          </Button>
        </Group>
      </form>
    </div>
  );
};
