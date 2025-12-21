'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { api, Deal } from '@/services/api'
import {
  formatAddress,
  formatAmount,
  signTransactionCorrect,
} from '@/utils/transactions'
import { ethers } from 'ethers'

export default function DealDetails() {
  const params = useParams()
  const router = useRouter()
  const dealId = (params?.dealId as string) || ''
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [accountState, setAccountState] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const loadAccountState = async (addr: string) => {
    try {
      const state = await api.getAccountState(addr)
      setAccountState(state)
    } catch (err) {
      console.error('Error loading account state:', err)
    }
  }

  const loadDeal = useCallback(async () => {
    if (!dealId) return
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
  }, [dealId])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
            loadAccountState(accounts[0])
          }
        })
        .catch(console.error)
    }

    if (dealId) {
      loadDeal()
    }
  }, [dealId, loadDeal])

  const handleAcceptDeal = async () => {
    if (!address || !window.ethereum || !accountState || !deal) {
      alert('Please connect your wallet and wait for account to load')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const nonce = accountState.nonce
      const payload = {
        dealId: deal.deal_id,
        amount: null, // Accept full amount
      }

      const signature = await signTransactionCorrect(
        signer,
        address,
        nonce,
        'AcceptDeal',
        payload
      )

      const submitRequest = {
        kind: 'AcceptDeal',
        from: address,
        deal_id: deal.deal_id,
        amount: null,
        nonce: nonce,
        signature: signature,
      }

      const result = await api.submitTransaction(submitRequest)
      alert(`Deal accepted successfully!\nTransaction Hash: ${result.tx_hash}`)

      // Reload deal and account state
      await loadDeal()
      await loadAccountState(address)
    } catch (err: any) {
      setError(err.message || 'Failed to accept deal')
      console.error('Error accepting deal:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelDeal = async () => {
    if (!address || !window.ethereum || !accountState || !deal) {
      alert('Please connect your wallet and wait for account to load')
      return
    }

    if (deal.maker.toLowerCase() !== address.toLowerCase()) {
      alert('Only the maker can cancel this deal')
      return
    }

    if (!confirm('Are you sure you want to cancel this deal?')) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const nonce = accountState.nonce
      const payload = {
        dealId: deal.deal_id,
      }

      const signature = await signTransactionCorrect(
        signer,
        address,
        nonce,
        'CancelDeal',
        payload
      )

      const submitRequest = {
        kind: 'CancelDeal',
        from: address,
        deal_id: deal.deal_id,
        nonce: nonce,
        signature: signature,
      }

      const result = await api.submitTransaction(submitRequest)
      alert(`Deal cancelled successfully!\nTransaction Hash: ${result.tx_hash}`)

      // Reload deal and account state
      await loadDeal()
      await loadAccountState(address)
    } catch (err: any) {
      setError(err.message || 'Failed to cancel deal')
      console.error('Error cancelling deal:', err)
    } finally {
      setProcessing(false)
    }
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

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          {address && (
            <div className="flex space-x-4 pt-4 border-t">
              {canAccept && (
                <button
                  onClick={handleAcceptDeal}
                  disabled={processing}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Accept Deal'}
                </button>
              )}
              {isMaker && deal.status === 'pending' && (
                <button
                  onClick={handleCancelDeal}
                  disabled={processing}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Cancel Deal'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
