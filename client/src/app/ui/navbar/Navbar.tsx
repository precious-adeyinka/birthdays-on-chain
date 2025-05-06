"use client"

import { useState } from "react"

// dependencies
import {poppins} from "@/app/fonts"
import Link from "next/link"
import Image from "next/image"
import clsx from "clsx"

import { CircleX, LogOut, User } from "lucide-react"
import { usePathname } from "next/navigation"

import { formatAddress } from "@/app/libs/utils"
import { useWagmiConnection } from "@/app/libs/hooks/useWagmiConnection"

export default function Home () {
    const pathname = usePathname()

    const mobileUrls = [
        {
            label: "Birthdays",
            url: "birthdays"
        },
        {
            label: "How it works",
            url: "how-it-works"
        },
    ]

    const {
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
    } = useWagmiConnection()


    const [showModal, setShowModal] = useState<boolean>(false)
    const toggleModal = () => setShowModal(!showModal)

    const toggleConnectWallet = () => {
        setShowConnectors(!showConnectors)
    }

    const changeUrl = (url:string) => {
        router.replace(url)
        setShowModal(false)
    }

    return (
        <nav className="h-auto p-5 md:p-2 w-full md:w-11/12 max-w-[1366px] mx-auto flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/90 backrgrop-blur-lg z-40 relative">
            {/* desktop */}
            <div className="w-auto md:flex space-x-8 items-center justify-left hidden">
                <Link 
                href="/birthdays"
                className={clsx(
                    "text-sm md:text-xs text-gray-700 font-normal",
                    {
                        "text-orange-500 font-medium": pathname.includes("birthdays")
                    }
                )}
                >
                    Birthdays
                </Link>

                <Link 
                href="/how-it-works"
                className={clsx(
                    "text-sm md:text-xs text-gray-700 font-normal",
                    {
                        "text-orange-500 font-medium": pathname.includes("how-it-works")
                    }
                )}
                >
                    How it works
                </Link>
            </div>

            {/* mobile */}
            <div className={clsx(
                "w-44 mx-auto flex flex-col space-y-3 items-center justify-center md:hidden bg-white rounded-lg p-4 shadow-lg fixed top-16 left-4 z-40 transition-all transform -translate-x-full duration-300",
                {
                    "invisible pointer-events-none -translate-x-full": showModal === false,
                    "visible pointer-events-auto translate-x-0": showModal === true,
                }

            )}>

                {
                    mobileUrls && mobileUrls.map((mobileUrl, id) => {
                        return (
                            <div 
                            key={id}
                            onClick={() => changeUrl(mobileUrl?.url)}
                            className={clsx(
                                "text-md md:text-xs text-gray-700 font-normal capitalize",
                                {
                                    "text-orange-500 font-medium": pathname.includes(mobileUrl.url.toLowerCase())
                                }
                            )}
                            >
                                {mobileUrl.label}
                            </div>
                        )
                    })
                }
            </div>

            <div className="h-auto w-auto flex items-center justify-center space-x-3 md:space-x-0">
                <div
                onClick={toggleModal}
                className="md:hidden h-auto w-8 flex flex-col items-center justify-center space-y-1">
                    <span className={clsx(
                        "h-[5px] w-full bg-black rounded-full transition-all duration-300 transform",
                        {
                            "rotate-0": showModal === false,
                            "rotate-45":showModal
                        }
                    )}></span>
                    <span className={clsx(
                        "h-[5px] w-full bg-black rounded-full transition-all duration-300 transform",
                        {
                            "-rotate-45": showModal,
                            "rotate-0": showModal === false,
                        }
                    )}></span>
                </div>
                <Link href="/" className={`font-bold text-md uppercase ${poppins.className} antialiased`}>Birthday-On-Chain</Link>
            </div>

            {
                isConnected ? (
                    <div className="flex flex-col md:flex-row space-x-3 items-center">
                        <h2 className="text-sm text-black font-medium">{formatAddress(address)}</h2>

                        <div className="flex space-x-2 md:space-x-3 items-center">
                            <Link href="/profile"
                            className="bg-orange-500 rounded-full p-2 flex items-center justify-center cursor-pointer">
                                <User size={20} color="white" />
                            </Link>

                            <div 
                            onClick={() => disconnect()}
                            className="bg-red-500 rounded-full p-2 flex items-center justify-center cursor-pointer">
                                <LogOut size={20} color="white" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div 
                    onClick={toggleConnectWallet}
                    className="bg-black text-xs text-white rounded-full py-2 px-4 flex items-center justify-center cursor-pointer">
                        Connect
                    </div>
                )
            }

            {/* wallets */}
            {
            !loading && showConnectors ? (
                    <div className="h-screen w-full bg-black/70 flex items-center justify-center backdrop-blur-sm absolute top-0 left-0 Z-[10000]">
                        <div className="h-auto w-80 flex flex-col space-y-4 rounded-lg bg-white relative p-3">
                            
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-black">Available Wallets</h3>
                                <button 
                                onClick={toggleConnectWallet}
                                className="cursor-pointer"
                                >
                                    <CircleX size={20} color="red"/>
                                </button>
                            </div>

                            <div className="flex flex-col space-y-3">
                                {
                                    connectors.map((connector) => {
                                        return (
                                            <button 
                                            key={connector.uid} 
                                            onClick={() => {
                                                handleConnect(connector)
                                            }}
                                            className="flex space-x-3 items-center justify-start bg-transparent border border-gray-200 rounded-md p-3 transition-all duration-700 hover:bg-gray-100 cursor-pointer"
                                            >
                                            {!connector?.icon && connector?.name.toLowerCase() === "metamask" ? (
                                                <Image
                                                src={`/assets/images/logo/metamask-fox.svg`} 
                                                alt={`${connector.name}`}
                                                height={30}
                                                width={30}
                                                />
                                            ) : connector?.name.toLowerCase() === "walletconnect" ? (
                                                <Image
                                                src={`/assets/images/logo/walletconnect.png`} 
                                                alt={`${connector.name}`}
                                                height={30}
                                                width={30}
                                                />
                                            ) : (
                                                <Image
                                                src={connector?.icon?.trim() ?? '/assets/images/logo/wallet.png'}
                                                alt={`${connector.name}`}
                                                height={30}
                                                width={30}
                                                />
                                            )}
                                            <p className="text-sm text-black font-medium">{connector.name}</p>
                                            </button>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                ) : null
            }

            {/* preloader */}
            {loading ? (
                <div className="h-screen w-full bg-black/70 flex items-center justify-center backdrop-blur-sm absolute top-0 left-0">
                    <div className="h-auto w-80 flex flex-col space-y-4 rounded-lg bg-white relative p-7">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <h3 className="text-lg font-bold text-black">Waiting for {selectedWallet}</h3>
                            <p className="text-xs text-gray-700 font-normal text-center">
                                Don&lsquo;t close or exit this window. Please continue connecting on your extension.
                            </p>
                            <div className="h-9 w-9 rounded-full border-2 boder-gray-50 border-t-orange-500 animate-spin"></div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* error */}
            {!loading && error ? (
                <div className="h-screen w-full bg-black/70 flex items-center justify-center backdrop-blur-sm absolute top-0 left-0">
                    <div className="h-auto w-80 flex flex-col space-y-4 rounded-lg bg-white relative p-5">
                        <div className="w-full flex flex-col items-center justify-start space-y-5">
                            <div className="w-full flex items-center justify-between">
                                <h3 className="text-md font-semibold text-black">Error Alert!</h3>
                                <button 
                                onClick={clearError}
                                >
                                    <CircleX size={20} color="red"/>
                                </button>
                            </div>
                            <p className="w-full text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            ) : null}
        </nav>
    )
}