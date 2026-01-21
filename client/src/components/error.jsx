import { XCircle } from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'

export const Error = ({
    setStatus
}) => {
    return (
        <div className="flex flex-col items-center gap-3 py-6">

            <XCircle className="h-12 w-12 text-red-500" />

            <p className="text-sm">
                {message}
            </p>

            <Button
                onClick={() => setStatus("idle")}
            >
                Try Again
            </Button>

        </div>
    )
}
