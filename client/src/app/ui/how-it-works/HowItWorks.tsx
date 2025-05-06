//deps
import clsx from "clsx"
import { poppins } from "@/app/fonts"
import Link from "next/link"
import Image from "next/image"
import {MoveRight, Heart} from "lucide-react"

export default function HowItWorks () {
    return (
        <section className="h-auto w-full overflow-hidden mt-12">
             {/* Hero */}
             <section className="h-auto w-11/12 mx-auto flex items-center justify-center">
                <div className="w-full flex flex-col items-center justify-center space-y-8">
                    <h2 className={clsx(
                        poppins.className,
                        "text-5xl md:text-8xl text-center font-bold uppercase"
                    )}>
                       So it&lsquo;s Your&nbsp;
                        <span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-orange-500">
                            <span className="relative text-white dark:text-gray-950">Birthday?</span>
                        </span>
                    </h2>
                    <p
                    className={clsx(
                        poppins.className,
                        "w-full px-3 md:px-0 md:w-9/12 mx-auto text-xl md:text-2xl font-medium capitalize text-center leading-normal"
                    )}
                    >
                        Create your birthday event, and every year you can celebrate on the blockchain. Receive crypto and sweet short wishes on your birthday!!
                    </p>

                    <Link 
                    href="/birthdays"
                    className="rounded-full bg-black flex space-x-3 items-center justify-center text-white font-normal text-xl px-10 py-4 cursor-pointer">
                        <span>Check it out</span>
                        <MoveRight size={"48"} color="white" />
                    </Link>
                </div>
            </section>

            {/* purpose */}
            <section className="h-auto w-full bg-gray-100 px-7 py-10 mt-16 flex items-center justify-center">
                <p className="w-full md:w-10/12 text-xl md:text-3xl font-bold leading-loose capitalize text-slate-700">Birthdays are
                &nbsp;<span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-0 before:bg-blue-500">
                            <span className="relative text-white dark:text-gray-950">Special days?</span>
                        </span>&nbsp;
                    for us because they mark the day we were born, the day our mothers fought to bring us into this world.
                    &nbsp;<span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-0 before:bg-pink-500">
                        <span className="relative text-white dark:text-gray-950">We are here,</span>
                        &nbsp;</span>&nbsp;
                    ready to be present on your special day, to bring
                    &nbsp;<span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-0 before:bg-orange-500">
                        <span className="relative text-white dark:text-gray-950">Happiness</span>
                    </span>&nbsp;
                    to the people you cherish.
                </p>
            </section>

            {/* Profile and Goals */}
            <div className="h-auto w-full flex flex-col items-center justify-center space-y-5 mt-16">
                <h3 className={clsx(
                    poppins.className,
                    "text-4xl md:text-6xl text-center font-bold text-black"
                )}>Birthday And Goals </h3>
                <p className={clsx(
                    poppins.className,
                    "text-center w-11/12 md:w-7/12 text-2xl text-gray-500 font-normal leading-normal"
                )}>You create your profile once, and you can set goals for your birthday by changing it anytime you want.</p>

                <Image 
                src="/assets/images/penguin-3d.png"
                alt="birthday and goals"
                height={500}
                width={500}
                />
            </div>

            {/* Family and Friends */}
            <div className="h-auto w-full flex flex-col items-center justify-center space-y-5 mt-16">
                <h3 className={clsx(
                    poppins.className,
                    "w-10/12 md:w-full text-4xl md:text-6xl text-center font-bold text-black"
                )}>Share With Family & Friends</h3>
                <p className={clsx(
                    poppins.className,
                    "text-center w-11/12 md:w-4/12 text-2xl text-gray-500 font-normal leading-normal"
                )}>Get a shareable link to send to your family and friends.</p>

                <Image 
                src="/assets/images/bird-3d.png"
                alt="share with family and friends"
                height={500}
                width={500}
                />
            </div>

            {/* Receive Donations */}
            <div className="h-auto w-full flex flex-col items-center justify-center space-y-5 mt-16">
                <h3 className={clsx(
                    poppins.className,
                    "text-4xl md:text-6xl text-center font-bold text-black"
                )}>Receive Donations</h3>
                <p className={clsx(
                    poppins.className,
                    "text-center w-11/12 md:w-5/12 text-2xl text-gray-500 font-normal leading-normal"
                )}>You can receive support (in crypto) from family and friends towards your birthday goal each year, when you share your links.</p>

                <Image 
                src="/assets/images/pigeon-3d.png"
                alt="receive donations"
                height={500}
                width={500}
                />
            </div>

            {/* On-Chain Notifications */}
            <div className="hidden h-auto w-full flex flex-col items-center justify-center space-y-5 mt-16">
                <h3 className={clsx(
                    poppins.className,
                    "text-4xl md:text-6xl text-center font-bold text-black"
                )}>On-Chain Notifications</h3>
                <p className={clsx(
                    poppins.className,
                    "text-center w-11/12 md:w-5/12 text-2xl text-gray-500 font-normal leading-normal"
                )}>Get notified of new donations or messages on chain to your email or phone.</p>

                <Image 
                src="/assets/images/hippo-3d.png"
                alt="on chain notifications"
                height={500}
                width={500}
                />
            </div>

            {/* Get Featured */}
            <div className="h-auto w-full flex flex-col items-center justify-center space-y-5 mt-16">
                <h3 className={clsx(
                    poppins.className,
                    "text-4xl md:text-6xl text-center font-bold text-black"
                )}>Get The Spotlight</h3>
                <p className={clsx(
                    poppins.className,
                    "text-center w-11/12 md:w-5/12 text-2xl text-gray-500 font-normal leading-normal"
                )}>Request to get featured on the top of the chain, this will set the spotlight on you!</p>

                <Image 
                src="/assets/images/duck-3d.png"
                alt="get the spotlight"
                height={500}
                width={500}
                />
            </div>

            {/* Get On Chain */}
            <section className="h-auto md:h-96 w-full bg-slate-800 py-10 px-5 md:p-10 mt-16 flex items-center justify-center">
                <div className="w-11/12 md:w-7/12 flex flex-col items-center justify-center space-y-7">
                    <h2 className={clsx(
                        poppins.className,
                        "text-7xl md:text-8xl text-center font-bold uppercase text-white"
                    )}>
                        Get On&nbsp;
                        <span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-orange-500">
                            <span className="relative text-white dark:text-gray-950">Chain!</span>
                        </span>
                    </h2>
                    <p
                    className={clsx(
                        poppins.className,
                        "full md:w-7/12 mx-auto text-xl md:text-2xl text-white/70 font-normal capitalize text-center leading-normal"
                    )}
                    >
                        Well what are you waiting for? An invitation, there you go!
                    </p>
                </div>
            </section>

           <div className="h-auto w-full flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 p-5 md:-0">
                {/* Creator */}
                <div className={clsx(
                    "w-auto flex items-center space-x-3 justify-end md:p-5"
                )}>
                    <p className="w-auto flex items-center space-x-1 justify-end text-xs text-gray-400 ">
                        <span className={clsx(
                            poppins.className,
                            "font-medium text-black antialiased"
                        )}>Built with&nbsp;</span>
                        <Heart color="red" size={18} />
                        <span className={clsx(
                            poppins.className,
                            "font-medium text-black antialiased"
                        )}>By&nbsp;</span>
                        <Link 
                        target="_blank"
                        href={`https://www.linkedin.com/in/precious-adeyinka`} className={clsx(
                            poppins.className,
                            "font-medium text-blue-500 antialiased"
                        )}>Precious Adeyinka</Link>
                    </p>
                </div>

                {/* Donate */}
                <div className={clsx(
                    "w-auto flex items-center space-x-3 justify-end md:p-5"
                )}>
                    <p className="w-auto flex items-center space-x-3 justify-end text-xs text-gray-400 ">
                        <span className={clsx(
                            poppins.className,
                            "font-medium text-black antialiased"
                        )}>Donate:</span>
                        <Heart color="red" size={18} />
                        <Link 
                        target="_blank"
                        href={`https://sepolia.etherscan.io/address/0x81DaE58150D62bfC27f6F1955975392FB8C12408`} className={clsx(
                            poppins.className,
                            "font-medium text-blue-500 antialiased"
                        )}>{`${'0x81DaE58150D62bfC27f6F1955975392FB8C12408'.substring(0,6)}...${'0x81DaE58150D62bfC27f6F1955975392FB8C12408'.substring(35)}`}</Link>
                    </p>
                </div>
           </div>
        </section>
    )
}