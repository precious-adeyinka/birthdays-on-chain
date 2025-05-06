"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { poppins } from "@/app/fonts";

import { MoveUpRight, X } from "lucide-react";

import { useMobileDetect } from "@/app/libs/hooks/useMobileDetect";

// Import Swiper React components
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

import { useDisclosure } from "@mantine/hooks";
import { Button, Group, NumberInput, Modal } from "@mantine/core";

import { useForm } from "@mantine/form";

import Preloader from "@/app/ui/preloader/Loader";

import { ethers } from "ethers";
import { useWatchContractEvent, useAccount, useWalletClient } from "wagmi";
import { WalletClient } from "viem";
import bocToken from "@/app/abis/BOCTokenV1.json";
import usersFacet from "@/app/abis/BOCUsersFacet.json";
import subscribeFacet from "@/app/abis/BOCSubscribeFacet.json";
// import bocToken from "@/../../artifacts/contracts/coin/BOCToken.sol/BOCTokenV1.json";
// import usersFacet from "@/../../artifacts/contracts/facets/BOCUsersFacet.sol/BOCUsersFacet.json";
// import subscribeFacet from "@/../../artifacts/contracts/facets/BOCSubscribeFacet.sol/BOCSubscribeFacet.json";
import { parseEther } from "viem";

interface EthersError {
  reason?: string;
  code?: string;
}

type IAddress = `0x${string}`;

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

interface ISubscriber {
  featureFee: number;
}

export default function FeaturedBirthdays() {
  const detectMobile = useMobileDetect();
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [subscribers, setSubscribers] = useState<IUser[]>([]);
  const [currency, setCurrency] = useState<bigint | null>(null);
  const [approving, setApproving] = useState<boolean>(false);
  const [subscribing, setSubscribing] = useState<boolean>(false);

  const onSubscriptionDone = () => {
    fetchSubscribers().then((subscribers) => {
      setSubscribers(subscribers);
      setLoading(false);
    });
    close();
  };

  const fetchSubscribers = async () => {
    try {
      const provider = await new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      const contract = await new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        subscribeFacet.abi,
        provider
      );
      const subscribers = await contract.getSubscribedUsers();
      return subscribers;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch subscribers:", error);
        setError(error?.message || "Failed to fetch subscribers");
      }
      console.log(error);
      return [];
    }
  };

  const fetchUser = async () => {
    try {
      const provider = await new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_JSON_RPC_URL
      );
      const contract = await new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        usersFacet.abi,
        provider
      );
      const user = await contract.getUser(address);
      setCurrency(user.currency);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Failed to fetch subscribers:", error);
        setError(error?.message || "Failed to fetch subscribers");
      }
      console.log(error);
      return [];
    }
  };

  useEffect(() => {
    if (error) {
      console.log(error);
      setLoading(false);
    }

    fetchSubscribers().then((subscribers) => {
      setSubscribers(subscribers);
      setLoading(false);

      // set the user currency if connected
      if (isConnected) {
        fetchUser();
      }
    });
  }, []);

  // Handle if there's no account and data is loading
  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="h-auto w-full md:w-11/12 mx-auto flex items-center justify-center">
      <div className="h-auto w-full bg-transparent">
        <Swiper
          loop={detectMobile.isMobile() ? true : false}
          spaceBetween={detectMobile.isMobile() ? 5 : 0}
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={detectMobile.isMobile() ? 2 : 3}
          coverflowEffect={{
            rotate: detectMobile.isMobile() ? 30 : 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          pagination={true}
          modules={[EffectCoverflow]}
          className="w-full p-3"
        >
          {isConnected &&
          subscribers.filter((u) => u.uid === address).length === 0 ? (
            <SwiperSlide className="h-auto min-w-[300px] md:min-w-[200px] w-full bg-center object-cover bg-blue-600 rounded-lg overflow-hidden">
              <div className="h-80 md:h-72 w-full flex flex-col items-center justify-center p-8 space-y-8">
                <p
                  className={clsx(
                    poppins.className,
                    "anitialiased text-4xl md:text-4xl font-semibold text-white w-full capitalize text-center"
                  )}
                >
                  Want to see your face here?
                </p>

                <div
                  onClick={open}
                  className="bg-white/20 rounded-full backdrop-blur-sm flex items-center py-2 px-5 justify-center cursor-pointer"
                >
                  <div
                    className={clsx(
                      poppins.className,
                      "font-medium text-sm text-white flex space-x-3 items-center justify-center"
                    )}
                  >
                    <span>Get Featured</span>
                    <div className="h-8 w-8 flex items-center bg-white justify-center rounded-full">
                      <MoveUpRight color="black" size="15" />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ) : null}

          {subscribers && subscribers.length > 0
            ? subscribers.map((featuredUser, i) => {
                return (
                  <SwiperSlide
                    className="h-auto min-w-[300px] md:min-w-[200px] w-full bg-center object-cover bg-gradient-to-r from-orange-500 via-blue-500 to-pink-500 rounded-lg overflow-hidden"
                    key={i}
                  >
                    <div className="h-72 md:h-72 w-full flex flex-col items-center justify-end relative overflow-hidden absolute bottom-0">
                      <Image
                        src={
                          featuredUser?.photo ||
                          "/assets/images/avatars/avatar-1.jpg"
                        }
                        alt={`${featuredUser?.fullname} Avatar`}
                        fill
                        className="h-full w-full object-contain"
                      />
                      <Link
                        href={`/birthday/${featuredUser?.uid}`}
                        className="bg-white rounded-full backdrop-blur-sm flex items-center py-1 px-3 justify-center cursor-pointer mb-7"
                      >
                        <div
                          className={clsx(
                            poppins.className,
                            "font-medium text-xs text-black flex space-x-3 items-center justify-center"
                          )}
                        >
                          <span>{featuredUser?.fullname}</span>
                          <div className="h-8 w-8 flex items-center bg-black justify-center rounded-full">
                            <MoveUpRight color="white" size="15" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </SwiperSlide>
                );
              })
            : null}
        </Swiper>
      </div>

      {/* modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Get Featured"
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
        <GetFeaturedForm
          onApprove={(action: boolean) => setApproving(action)}
          onSubscribe={(action: boolean) => setSubscribing(action)}
          currency={currency}
          onSubscriptionDone={onSubscriptionDone}
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
              <h3 className="text-lg font-bold text-black">Subscribing</h3>
              <p className="text-xs text-gray-700 font-normal text-center">
                Your subscription is now in progress...
              </p>
              <div className="h-9 w-9 rounded-full border-2 boder-gray-50 border-t-orange-500 animate-spin"></div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const GetFeaturedForm = ({
  currency,
  onSubscriptionDone,
  onApprove,
  onSubscribe,
}: {
  currency: bigint | null;
  onSubscriptionDone: () => void;
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

  const subscribeUser = async (subscriber: ISubscriber) => {
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
        subscribeFacet.abi,
        await signer
      );

      if (currency === BigInt(0)) {
        await contract.subscribeWithToken(
          parseEther(String(subscriber.featureFee))
        );
      } else {
        await contract.subscribeWithEther({
          value: parseEther(String(subscriber.featureFee)),
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
        } else {
          console.log(err);
          setError("Something went wrong, please try again later!");
        }
      } else {
        console.log(err);
        setError("Error: Failed to subscribe user!");
        setLoading(false);
        onSubscribe(false);
      }
    }
  };

  const approveTokenAllowance = async (amount: string | number) => {
    try {
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

      await contract.approve(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        parseEther(String(amount)),
        {
          from: address,
        }
      );

      // check allowance
      const allowance = await contract.allowance(
        address,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      if (allowance < amount) {
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
    abi: subscribeFacet.abi,
    eventName: "UserSubscribed",
    onLogs(logs) {
      if (formSubmitted) {
        console.log(logs);
        onSubscriptionDone();
      }
    },
  });

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      featureFee: 0,
    },

    validate: {
      featureFee: (value: number) =>
        value === 1 ? null : "Please enter the fee amount",
    },
  });

  const handleSubmit = async (values: { featureFee: number }) => {
    try {
      setLoading(true);
      const newSubscriber = { ...values };

      if (currency === BigInt(0)) {
        await approveTokenAllowance(newSubscriber.featureFee);
      }

      subscribeUser(newSubscriber);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center w-full h-auto">
      {error ? (
        <div className="text-red-500 text-center w-11/12 md:w-full text-xs">
          {error || "Failed to subscriber user, please try again"}
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        <Group grow className="w-full" justify="space-between" mt="md">
          <NumberInput
            prefix={currency === BigInt(0) ? "BOC " : "ETH "}
            allowNegative={false}
            min={1}
            max={1}
            maxLength={1}
            label={`The cost to feature is 1 ${
              currency === BigInt(0) ? "BOC" : "ETH"
            }`}
            placeholder={`1 ${currency === BigInt(0) ? "BOC" : "ETH"}`}
            key={form.key("featureFee")}
            {...form.getInputProps("featureFee")}
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
                  Your are becoming popular...
                </span>
                <div className="h-5 w-5 rounded-full border-[3px] border-gray-200 border-t-black animate-spin"></div>
              </div>
            ) : currency === BigInt(0) ? (
              "Pay with BOC"
            ) : (
              "Pay with ETH"
            )}
          </Button>
        </Group>
      </form>
    </div>
  );
};
