import { 
    Timeline, 
    TimelineItem,
    Text 
} from '@mantine/core';

import {
Cake,
FlagTriangleLeft
} from "lucide-react"

import {formatToBirthdayTimeline, formatBirthday} from "@/app/libs/utils/index"

interface IGoal {
    createdAt: bigint;
    description: string;
    targetAmount: bigint;
    amountRaised?: bigint;
}

interface IBirthday {
    id: bigint;
    createdAt: bigint;
    when: bigint;
    goal: IGoal;
    timeline: IBirthdayTimeline[];
}

interface IBirthdayTimeline {
    createdAt: bigint;
}

export default function BirthdayTimeline({birthday}: {
    birthday: IBirthday;
  }) {

    return (
        <div className='p-5'>
            {
                birthday && Number((birthday as IBirthday)?.when) > 0 ? (
                    <Timeline active={0} bulletSize={24} lineWidth={2}>
                       {
                        ((birthday as IBirthday).timeline as IBirthdayTimeline[]).map((timeline:IBirthdayTimeline, id: number) => {
                            return (
                                <TimelineItem 
                                key={id}
                                title={formatToBirthdayTimeline(id + 1)}
                                bullet={<Cake size={12} />}>
                                    {
                                        id == 0 ? (
                                            <Text c="dimmed" size="sm">And the journey begins!</Text>
                                        ) : null
                                    }
                                    <Text size="xs" mt={4}>
                                        {formatBirthday(Number(timeline?.createdAt))}
                                    </Text>
                                </TimelineItem>
                            )
                        })
                       }
        
                    </Timeline>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center space-y-1">
                        <FlagTriangleLeft color="gray" size="60" />
                        <h2 className="texxt-xl font-medium text-gray-700 capitalize">Your timeline is empty</h2>
                        <p className="text-sm text-gray-600 font-light text-center w-9/12 md:w-7/12">
                            Your birthday timeline will appear here once every year.
                        </p>
                    </div>
                )
            }
        </div>
    );
}