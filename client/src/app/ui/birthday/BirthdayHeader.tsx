import Image from "next/image"
import {formatBirthday} from "@/app/libs/utils/index"

interface IUser {
    fullname: string;
    nickname: string;
    gender: string;
    photo: string;
    joinedDate: number;
    isActive: boolean;
    hasSubscription: boolean;
}

export default function ProfileHeader({data}: {data:IUser;}) {
    return (
        <section className="h-auto w-full mx-auto rounded-lg bg-gradient-to-r from-orange-500 via-blue-500 to-pink-500 position relative pb-5 flex flex-col items-center justify-center">
            <div 
            className="h-20 w-20 rounded-full bg-white ring-[10px] ring-white relative overflow-hidden absolute -top-14 bg-center">
                <Image 
                src={data?.photo || "/assets/images/avatars/avatar-1.jpg"}
                alt="user avatar"
                height={300}
                width={300}
                />
            </div>

            {/* content */}
            <div className="h-auto flex flex-col items-center justify-center -mt-8">
                <h2 className="text-lg text-white font-medium">{data?.fullname}</h2>
                <p className="text-xs text-white/80 mt-0.5">{`Joined ${formatBirthday(Number(data?.joinedDate))}`}</p>
            </div>
        </section>
    )
}