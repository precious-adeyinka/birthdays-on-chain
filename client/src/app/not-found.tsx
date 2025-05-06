import Link from 'next/link'
import Image from 'next/image'
 
export default function NotFound() {
  return (
    <div className="h-auto w-full flex flex-col items-center justify-center space-y-5 overflow-hidden p-12">
        <Image 
        src="/assets/images/404.png"
        alt="404 art"
        height={300}
        width={300}
        />
        
        <p className="text-md text-gray-700">Could not find requested resource</p>

        <Link href="/" className="bg-orange-500 text-xs text-white rounded-full py-2 px-4 flex items-center justify-center">
            Return Home
        </Link>
    </div>
  )
}