"use client";

import { Tabs } from "@mantine/core";

// import BirthdayTimeline from "./BirthdayTimeline";
import BirthdayMessages from "./BirthdayMessages";
import BirthdayGifters from "./BirthdayGifters";

interface IUser {
  fullname: string;
  nickname: string;
  gender: string;
  photo: string;
  currency: bigint;
  isActive: boolean;
  hasSubscription: boolean;
}

export default function ProfielTabs({ user }: { user: IUser }) {
  return (
    <Tabs
      color="orange"
      variant="pills"
      radius="xl"
      defaultValue="messages"
      className="w-full"
    >
      <div className="w-full sticky top-0 left-0 z-30">
        <Tabs.List justify="left" className="p-3 bg-white">
          <Tabs.Tab value="messages">Messages</Tabs.Tab>
          <Tabs.Tab value="gifters">Gifters</Tabs.Tab>
          {/* <Tabs.Tab value="timelines">Timeline</Tabs.Tab> */}
        </Tabs.List>
      </div>

      <Tabs.Panel value="messages">
        <BirthdayMessages />
      </Tabs.Panel>

      <Tabs.Panel value="gifters">
        <BirthdayGifters currency={user?.currency} />
      </Tabs.Panel>

      {/* <Tabs.Panel value="timelines">
        <BirthdayTimeline birthday={birthday as IBirthday} />
      </Tabs.Panel> */}
    </Tabs>
  );
}
