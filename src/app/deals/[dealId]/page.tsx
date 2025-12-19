'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { api, Deal } from '@/services/api'
import { formatAddress, formatAmount } from '@/utils/transactions'

export default function DealDetails() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.dealId as string
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
          }
        })
        .catch(console.error)
    }

    loadDeal()
  }, [dealId])

  const loadDeal = async () => {
    setLoading(true)
    setError(null)
    try {
      const dealData = await api.getDealDetails(parseInt(dealId))
      setDeal(dealData)
    } catch (err: any) {
      setError(err.message || 'Failed to load deal')
      console.error('Error loading deal:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptDeal = async () => {
    if (!address) {
      alert('Please connect your wallet')
      return
    }

    // TODO: Implement accept deal transaction
    alert('Accept deal functionality will be implemented')
  }

  const handleCancelDeal = async () => {
    if (!address) {
      alert('Please connect your wallet')
      return
    }

    if (deal?.maker.toLowerCase() !== address?.toLowerCase()) {
      alert('Only the maker can cancel this deal')
      return
    }

    // TODO: Implement cancel deal transaction
    alert('Cancel deal functionality will be implemented')
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-8">
          <p className="text-gray-600">Loading deal details...</p>
        </div>
      </Layout>
    )
  }

  if (error || !deal) {
    return (
      <Layout>
        <div className="px-4 py-8">
          <div className="bg-red-50 rounded-lg shadow p-6">
            <p className="text-red-600">
              {error || 'Deal not found'}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  const isMaker = deal.maker.toLowerCase() === address?.toLowerCase()
  const canAccept = !isMaker && deal.status === 'pending' && address

  return (
    <Layout>
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Back to Deals
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Deal #{deal.deal_id}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span
              className={`px-3 py-1 text-sm rounded ${
                deal.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : deal.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {deal.status}
            </span>
            {deal.visibility === 'private' && (
              <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded">
                Private
              </span>
            )}
          </div>

          {/* Deal Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Maker</h3>
              <p className="font-mono text-sm">{formatAddress(deal.maker)}</p>
            </div>
            {deal.taker && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Taker
                </h3>
                <p className="font-mono text-sm">{formatAddress(deal.taker)}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Base Asset
              </h3>
              <p>ID: {deal.asset_base}</p>
              <p className="text-xs text-gray-500">
                Chain: {deal.chain_id_base}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Quote Asset
              </h3>
              <p>ID: {deal.asset_quote}</p>
              <p className="text-xs text-gray-500">
                Chain: {deal.chain_id_quote}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Amount (Base)
              </h3>
              <p className="text-lg font-semibold">
                {formatAmount(BigInt(deal.amount_base))}
              </p>
              {deal.amount_remaining && (
                <p className="text-xs text-gray-500">
                  Remaining: {formatAmount(BigInt(deal.amount_remaining))}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Price</h3>
              <p className="text-lg font-semibold">
                {formatAmount(BigInt(deal.price_quote_per_base))} per base
              </p>
            </div>
          </div>

          {/* Actions */}
          {address && (
            <div className="flex space-x-4 pt-4 border-t">
              {canAccept && (
                <button
                  onClick={handleAcceptDeal}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Accept Deal
                </button>
              )}
              {isMaker && deal.status === 'pending' && (
                <button
                  onClick={handleCancelDeal}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel Deal
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
