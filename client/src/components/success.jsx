import { CheckCircle2 } from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'

export const Success = ({
    onOpenChange,
    message,
    resetForm
}) => {
  return (
    <div className="flex flex-col items-center gap-3 py-6">

            <CheckCircle2  className="h-12 w-12 text-green-500" />

            <p className="text-sm">
              {message}
            </p>

            <Button
              onClick={() =>{ 
                onOpenChange(false)
                resetForm && resetForm()
              }}
            >
              Close
            </Button>
          </div>
  )
}
