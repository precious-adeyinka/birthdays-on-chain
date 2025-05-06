"use client"
import React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider, createConfig, createStorage } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!

const isClient = typeof window !== 'undefined';

const storage = isClient
  ? createStorage({ storage: window.localStorage })
  : createStorage({
      storage: {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      },
    });

const config = createConfig({
    ssr: true,
    chains: [mainnet, sepolia, hardhat],
    storage: storage,
    connectors: [
        walletConnect({
            projectId
        }),
        metaMask(),
    ],
    transports: {
      [mainnet.id]: http(process.env.NEXT_PUBLIC_CONTRACT_ALCHEMY_MAINNET_RPC_URL),
      [sepolia.id]: http(process.env.NEXT_PUBLIC_CONTRACT_ALCHEMY_SEPOLIA_TESTNET_RPC_URL),
      [hardhat.id]: http("http://localhost:8545"),
    },
});

const client = new QueryClient();

export default function Provider({ children }: {children: Readonly<React.ReactNode>}) {
    return (
        <WagmiProvider 
        config={config}
        reconnectOnMount={true}
        >
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}