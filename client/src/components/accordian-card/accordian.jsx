import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

/* ---------- STATIC DATA ---------- */

const deploymentGroups = [
  {
    _id: 'group-1',
    name: 'Production',
    deployments: [
      { _id: 'dep-101', name: 'API Server' },
      { _id: 'dep-102', name: 'Web App' },
    ],
  },
  {
    _id: 'group-2',
    name: 'Staging',
    deployments: [{ _id: 'dep-201', name: 'Staging API' }],
  },
  {
    _id: 'group-3',
    name: 'Development',
    deployments: [],
  },
]

const isGroupsLoading = false
const isDeleting = false


const SuperAdmin = () => {
  const handleDeleteGroup = (groupId) => {
    //console.log('Delete group:', groupId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={"font-extrabold text-2xl"}>Brands</CardTitle>
      </CardHeader>

      <CardContent>
        {isGroupsLoading ? (
          <div>Loading brands</div>
        ) : deploymentGroups.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No brands created yet.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {deploymentGroups.map((group) => (
              <AccordionItem key={group._id} value={group._id}>
                <div className="flex items-center justify-between px-3 py-2">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <span className="font-medium truncate">
                      {group.name}
                    </span>
                  </AccordionTrigger>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {group.deployments?.length || 0}
                    </Badge>

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-200 disabled:opacity-50"
                      onClick={() => handleDeleteGroup(group._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    {group.deployments?.length ? (
                      group.deployments.map((dep) => (
                        <div
                          key={dep._id}
                          className="flex justify-between text-sm border-b pb-1"
                        >
                          <span className="font-mono text-xs">
                            {dep._id}
                          </span>
                          <span>{dep.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No deployments
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

export default SuperAdmin
