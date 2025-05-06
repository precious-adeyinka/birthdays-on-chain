"use client"

import {useState} from "react"

import clsx from "clsx"
import {poppins} from "@/app/fonts"

import { X } from "lucide-react"
import { useDisclosure } from '@mantine/hooks';
import { Button, Group, Modal,TextInput, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { useWriteContract, useWatchContractEvent } from "wagmi"
import birthdaysFacet from "@/../../artifacts/contracts/facets/BOCBirthdaysFacet.sol/BOCBirthdaysFacet.json"

interface IGoal {
  description: string;
  targetAmount: number;
}

type IAddress = `0x${string}`

export default function Goal({birthdayId}: {birthdayId: number;}) {
  const [opened, { open, close }] = useDisclosure(false);

  const onGoalCreated = () => close()

  return (
    <div className="w-full h-auto flex flex-col items-center justify-center space-y-2">
      <h2 className={clsx(
        poppins.className,
        "text-md font-medium text-center font-semibold capitalize"
      )}>You do not have a goal!</h2>
      <p className={clsx(
        poppins.className,
        "w-6/12 md:w-7/12 text-xs text-gray-700 font-normal text-center"
      )}>Create your goal and share with everyone.</p>

      <div 
      onClick={open}
      className="cursor-pointer rounded-full py-2 px-4 flex items-center justify-center text-[12px] text-white font-medium bg-black">
        Create Goal
      </div>

      {/* modal */}
      <Modal 
      opened={opened} 
      onClose={close} 
      title="Create Goal" 
      overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
      }}
      transitionProps={{ transition: 'fade', duration: 600, timingFunction: 'linear' }}
      closeButtonProps={{
          autoFocus: false,
          icon: <X size={20} />,
      }}
      size={"lg"}
      centered>
          {/* Modal content */}
          <GoalForm 
            birthdayId={birthdayId}
            onGoalCreated={onGoalCreated}
          />
      </Modal>
    </div>
  )
}

const GoalForm = ({birthdayId, onGoalCreated}: {onGoalCreated: () => void; birthdayId: number;}) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { writeContract } = useWriteContract()

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
    abi: birthdaysFacet.abi,
    eventName: 'GoalCreated',
    onLogs(logs) {
      console.log(logs)
      onGoalCreated()
    },
  })
  

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      description: '',
      targetAmount: 0,
    },

    validate: {
      description: (value) => value.length > 0 ? null : 'Please type your goal',
      targetAmount: (value) => value > 0 ? null : 'Please type your amount',
    },
  });

  const handleSubmit = (values:IGoal) => {
    try {
      setLoading(true)
      const newGoal = {...values}

      writeContract({ 
        abi: birthdaysFacet.abi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as IAddress,
        functionName: 'createGoal',
        args: [
          birthdayId,
          newGoal.description,
          newGoal.targetAmount,
        ],
      })
    }
    catch (err) {
      console.log(err)
    }
}

  return (
    <div className="w-full h-auto">
      <form onSubmit={form.onSubmit(handleSubmit)} className="w-full">
        <Group grow className="w-full" justify="space-between">
          <TextInput 
            label="Describe your goal"
            placeholder="I want a PS5"
            key={form.key('description')}
            {...form.getInputProps('description')}
          />
        </Group>

        <Group grow className="w-full" justify="space-between" mt="md">
          <NumberInput 
              prefix="$"
              allowNegative={false}
              min={1}
              max={10000}
              thousandSeparator=","
              label="How much do you need?"
              placeholder="$300"
              key={form.key('targetAmount')}
              {...form.getInputProps('targetAmount')}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button 
          disabled={loading}
          type="submit" 
          variant="filled" color="orange" size="xs" radius="xl"
          >
            {loading ? (
                <div className="flex items-center justify-center space-x-2">
                    <span className="text-black text-xs">Creating your goal...</span>
                    <div className="h-5 w-5 rounded-full border-[3px] border-gray-200 border-t-black animate-spin"></div>
                </div>
            ) : "Submit"}
          </Button>
        </Group>
      </form>
    </div>
  )
}