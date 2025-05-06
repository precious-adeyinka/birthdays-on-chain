"use client";

import { useState } from "react";

import { formatEther } from "viem";
import { formatNumber } from "@/app/libs/utils/index";
import { poppins } from "@/app/fonts";
import clsx from "clsx";

import { MessageCircleWarning } from "lucide-react";

import { Alert } from "@mantine/core";

import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { WalletClient } from "viem";
import birthdaysFacet from "@/app/abis/BOCBirthdaysFacet.json";
// import birthdaysFacet from "@/../../artifacts/contracts/facets/BOCBirthdaysFacet.sol/BOCBirthdaysFacet.json";

interface EthersError {
  reason?: string;
  code?: string;
}

export default function EtherBalance({
  balance,
  onWithdraw,
}: {
  balance: bigint;
  onWithdraw: () => void;
}) {
  const icon = <MessageCircleWarning />;

  const { address } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const withdrawEther = async () => {
    try {
      setLoading(true);

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

      await contract.userWithdrawEther();

      onWithdraw();
      setLoading(false);
    } catch (err) {
      setLoading(false);

      if (err instanceof Error) {
        if ((err as EthersError).reason) {
          console.log((err as EthersError).reason as string);
          setError((err as EthersError).reason as string);
          //  unmount error alert UI
          setTimeout(() => {
            setError(null);
          }, 3000);
        } else {
          console.log(err);
          setError("Something went wrong, please try again later!");
          //  unmount error alert UI
          setTimeout(() => {
            setError(null);
          }, 3000);
        }
      } else {
        console.log(err);
        setError("Error: Failed to withdraw Ether!");
        //  unmount error alert UI
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    }
  };

  return (
    <div className="h-auto w-auto">
      <div className="flex flex-col items-center justify-center space-y-1 absolute left-3 md:left-7 top-1/2 transform -translate-y-1/2">
        <h4
          className={clsx(poppins.className, "text-md font-medium text-white")}
        >
          {formatNumber(Number(formatEther(balance || BigInt(0))))}
        </h4>
        <div
          disabled={loading}
          onClick={withdrawEther}
          className={clsx(
            "rounded-full flex items-center justify-center text-white bg-purple-500 px-3 py-2 text-[10px] cursor-pointer",
            {
              "pointer-events-none cursor-not-allowed bg-gray-300": loading,
            }
          )}
        >
          {loading ? "Processing..." : "Withdraw ETH"}
        </div>
      </div>

      {error && error.length > 0 ? (
        <div className="fixed bottom-5 right-0 z-40 h-auto w-auto p-5">
          <Alert
            withCloseButton={true}
            onClose={() => setError(null)}
            title="Withdrawal Error"
            variant="filled"
            color="red"
            icon={icon}
          >
            {error || "Failed to withdraw Ether please try again later!"}
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
