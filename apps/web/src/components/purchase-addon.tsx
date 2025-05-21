"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface PurchaseAddonProps {
  onClose: () => void
}

export function PurchaseAddon({ onClose }: PurchaseAddonProps) {
  const [quantity, setQuantity] = useState(1)

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Purchase addon</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 mb-6">You need to upgrade your plan to add more AI agents</p>

          <div className="flex items-center mb-6">
            <span className="mr-2">I want to buy</span>
            <div className="relative flex items-center">
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                className="w-16 text-center"
              />
              <div className="absolute right-0 top-0 bottom-0 flex flex-col">
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={handleIncrement}>
                  <ChevronUpIcon className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={handleDecrement}>
                  <ChevronDownIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <span className="ml-2">extra agents</span>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Note: you will be immediately charged a prorated amount for the remaining days.
          </p>

          <div className="mb-6">
            <div className="text-2xl font-bold">$7</div>
            <div className="text-sm text-gray-600">Total per month</div>
          </div>

          <Button className="w-full bg-black text-white hover:bg-gray-800">Buy</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ChevronUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
