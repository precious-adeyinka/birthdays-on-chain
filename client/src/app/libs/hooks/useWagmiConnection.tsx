"use client";

import { useState, useEffect } from "react";

import { BaseError } from "wagmi";

// dependencies
import { useRouter } from "next/navigation";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useReconnect,
  Connector,
  useAccountEffect,
  createStorage,
  deserialize,
  serialize,
} from "wagmi";

interface MMError {
  code?: number;
  message?: string;
}

const isClient = typeof window !== "undefined";

const storage = isClient
  ? createStorage({
      key: "boc",
      deserialize,
      serialize,
      storage: window.localStorage,
    })
  : createStorage({
      storage: {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      },
    });

export const useWagmiConnection = () => {
  const router = useRouter();

  const [showConnectors, setShowConnectors] = useState<boolean>(false);
  const { reconnect } = useReconnect();
  const { address, isConnected } = useAccount();
  const { connectors, connect, error: connectingError } = useConnect();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // handles actual connection trigger
  const handleConnect = async (connector: Connector) => {
    try {
      setLoading(true);
      setSelectedWallet(connector.name);
      await connect({ connector });
    } catch (err) {
      setShowConnectors(false);
      setError("Trouble connecting to wallet, please try again");
      console.log("Connection error: ", err);
    } finally {
      setLoading(false);
    }
  };

  // clean error utility
  const clearError = () => setError(null);

  // connection side-effects
  useAccountEffect({
    onConnect(data) {
      console.log("Connected!", {
        address: data.address,
        chainId: data.chainId,
        isReconnected: data.isReconnected,
      });
    },

    onDisconnect() {
      storage.removeItem("user");
      router.push("/");
    },
  });

  // when connected persist session info
  useEffect(() => {
    if (isConnected) {
      setShowConnectors(false);
      setLoading(false);

      const prev = localStorage.getItem("user");
      const current = JSON.stringify({ address, isConnected });
      if (prev !== current) storage.setItem("user", current);
    }
  }, [address, isConnected]);

  // try reconnect on initial mount
  useEffect(() => {
    const tryReconnecting = async () => {
      try {
        const serializedUser = await storage.getItem("user");
        const deserializedUser = JSON.parse(serializedUser as string);

        if (deserializedUser && !isConnected) {
          reconnect();
        }
      } catch (err) {
        console.warn("Failed to parse user data:", err);
      }
    };

    tryReconnecting();
  }, []);

  // watch for connection errors
  useEffect(() => {
    if (!connectingError) return;

    const mmError = connectingError?.cause as MMError;

    if (mmError?.code === 4001) {
      setError(mmError.message || "User rejected the connection.");
    } else {
      setError(
        (connectingError as BaseError).shortMessage ||
          "Failed to connect wallet!"
      );
    }

    setLoading(false);
    setShowConnectors(false);
  }, [connectingError]);

  return {
    address,
    isConnected,
    connectors,
    handleConnect,
    disconnect,
    loading,
    error,
    clearError,
    selectedWallet,
    showConnectors,
    setShowConnectors,
    router,
  };
};
