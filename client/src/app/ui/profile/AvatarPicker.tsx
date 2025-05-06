"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import clsx from "clsx";

export default function AvatarPicker({
  onAvatarChanged,
  isError,
  hasAvatar,
}: {
  isError: boolean;
  onAvatarChanged: (avatar: string) => void;
  hasAvatar?: string;
}) {
  const [selectedAvatar, setSelectedAvatar] =
    useState<string>("Choose your avatar");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    null
  );
  const [picking, setPicking] = useState<boolean>(false);
  const togglePicking = () => {
    setPicking(!picking);
  };

  const avatars = [
    // {
    //     url: "/assets/images/avatars/avatar-1.jpg",
    //     label: "Referee"
    // },
    {
      url: "/assets/images/avatars/avatar-2.png",
      label: "Cute Guy",
    },
    {
      url: "/assets/images/avatars/avatar-3.png",
      label: "Mexican Guy",
    },
    {
      url: "/assets/images/avatars/avatar-4.png",
      label: "Cute Girl",
    },
  ];

  const findAvatarWithPath = (path: string) => {
    return avatars.find((avatar) => avatar.url === path)?.label ?? null;
  };

  useEffect(() => {
    if (hasAvatar && hasAvatar.length > 0) {
      setSelectedAvatarUrl(hasAvatar);
      const avatarName = findAvatarWithPath(hasAvatar);
      if (avatarName) {
        setSelectedAvatar(avatarName);
      }
    }
  }, []);

  return (
    <div className="h-auto w-full flex flex-col items-start justify-center">
      <div
        className={clsx("h-9 w-full rounded-md border relative", {
          "border-gray-300": !isError,
          "border-red-300": isError,
        })}
      >
        <p
          onClick={togglePicking}
          className={clsx(
            "h-full w-full text-xs font-normal flex items-center justify-start space-x-2 py-2 px-3 cursor-pointer capitalize",
            {
              "text-black": !isError,
              "text-red-500": isError,
            }
          )}
        >
          {selectedAvatarUrl ? (
            <Image
              src={selectedAvatarUrl}
              height={30}
              width={30}
              className="rounded-md"
              alt={`${selectedAvatar} Avatar`}
            />
          ) : null}
          <span>{selectedAvatar}</span>
        </p>

        {/* gallery */}
        {picking ? (
          <div
            className={`h-auto w-full bg-white rounded-lg p-1 grid grid-cols-3 md:grid-cols-4 gap-2 shadow-lg absolute top-full mt-2 left-0 z-30`}
          >
            {avatars &&
              avatars.map((avatar, id) => {
                return (
                  <div
                    key={id + avatar.url}
                    onClick={() => {
                      setSelectedAvatar(avatar.label);
                      setPicking(false);
                      setSelectedAvatarUrl(avatar.url);
                      onAvatarChanged(avatar.url);
                    }}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-gray-100 p-2 cursor-pointer space-y-2"
                  >
                    <div className="h-28 w-28 rounded-full relative overflow-hidden flex items-center justify-center">
                      <Image
                        src={avatar.url}
                        fill
                        alt={`${avatar?.label} Avatar`}
                      />
                    </div>
                    <h4 className="text-xs font-medium text-gray-700">
                      {avatar.label}
                    </h4>
                  </div>
                );
              })}
          </div>
        ) : null}
      </div>

      {isError ? (
        <p className="text-xs pt-1 text-red-500 text-left">
          Please select a photo
        </p>
      ) : null}
    </div>
  );
}
