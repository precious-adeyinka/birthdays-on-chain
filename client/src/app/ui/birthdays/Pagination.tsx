import {poppins} from "@/app/fonts"
import clsx from "clsx"
import {
    MoveLeft,
    MoveRight
} from "lucide-react"

export default function Pagination() {
    return (
        <div className="my-5 h-12 w-11/12 mx-auto flex items-center justify-center">
            <div className={
                clsx(
                    poppins.className,
                    "h-full w-12 flex items-center justify-center text-md font-medium bg-black text-white"
                )
            }>
                <MoveLeft color="white" size="20" />
            </div>

            <div className={
                clsx(
                    poppins.className,
                    "h-full w-12 flex items-center justify-center text-md font-medium text-black border border-gray-700"
                )
            }>1</div>
            
            <div className={
                clsx(
                    poppins.className,
                    "h-full w-12 flex items-center justify-center text-md font-medium bg-black text-white"
                )
            }>
                <MoveRight color="white" size="20" />
            </div>
        </div>
    )
}