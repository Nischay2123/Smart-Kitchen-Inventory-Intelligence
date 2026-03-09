import SiteHeader from '@/components/site-header'
import React, { useState } from 'react'
import { toast } from 'sonner'
import DataCard from '@/components/data-card/data-card'

import {
  useGetAllApiKeysQuery,
  useRevokeApiKeyMutation,
} from "@/redux/apis/brand-admin/posApiKeyApi"
import { GenerateApiKeyModal } from '@/components/Form/brand-admin-form/generate-api-key-form'
import { apiKeyColumns } from '@/utils/columns/brand-admin'
import { SkeletonLoader } from '@/components/laoder'
import { ConfirmModal } from '@/components/common/ConfirmModal'

export const ApiKeys = () => {
  const [open, setOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState(null);

  const {
    data,
    isLoading,
    isError,
  } = useGetAllApiKeysQuery()

  const [revokeApiKey, { isLoading: isRevoking }] = useRevokeApiKeyMutation()

  const handleRevokeApiKey = (apiKey) => {
    setKeyToRevoke(apiKey);
  };

  const confirmRevoke = async () => {
    try {
      if (!keyToRevoke) return;
      await revokeApiKey({ apiKeyId: keyToRevoke.keyId }).unwrap();
      toast.success("API Key revoked successfully");
    } catch (error) {
      console.error("Failed to revoke API key", error);
      toast.error(error?.data?.message || "Failed to revoke API key");
    } finally {
      setKeyToRevoke(null);
    }
  };

  return (
    <div className='w-full bg-gray-50 min-h-screen'>
      <SiteHeader
        headerTitle="POS API Keys"
        description="Manage API keys for external POS systems"
        actionTooltip="Generate API Key"
        onActionClick={() => setOpen(true)}
      />
      <div className="flex-1 min-h-0 p-4 lg:p-6">
        {
          isLoading ?
            <SkeletonLoader /> :
            <DataCard
              title={"API Keys"}
              searchable
              loading={isLoading || isRevoking}
              columns={apiKeyColumns(handleRevokeApiKey)}
              data={data?.data?.apiKeys ?? []}
              titleWhenEmpty={"No API keys found"}
              descriptionWhenEmpty={"No API keys have been generated yet. Create one to allow POS systems to submit sales data."}
            />
        }
      </div>

      <GenerateApiKeyModal
        open={open}
        onOpenChange={setOpen}
      />

      <ConfirmModal
        isOpen={!!keyToRevoke}
        onClose={() => setKeyToRevoke(null)}
        onConfirm={confirmRevoke}
        title={`Revoke API Key for "${keyToRevoke?.outlet?.outletName}"?`}
        description="This action cannot be undone. POS systems using this key will no longer be able to submit sales data. You will need to generate a new key and reconfigure your POS systems."
        confirmText="Revoke"
        isDanger={true}
        loading={isRevoking}
      />
    </div>
  )
}
