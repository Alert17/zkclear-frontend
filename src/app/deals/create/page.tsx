'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { api } from '@/services/api'
import { ethers } from 'ethers'
import { parseAmount, signTransactionCorrect } from '@/utils/transactions'

export default function CreateDeal() {
  const router = useRouter()
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountState, setAccountState] = useState<any>(null)

  // Form fields
  const [dealId, setDealId] = useState<string>('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [taker, setTaker] = useState<string>('')
  const [assetBase, setAssetBase] = useState<string>('1')
  const [assetQuote, setAssetQuote] = useState<string>('2')
  const [chainIdBase, setChainIdBase] = useState<string>('8453')
  const [chainIdQuote, setChainIdQuote] = useState<string>('8453')
  const [amountBase, setAmountBase] = useState<string>('')
  const [priceQuotePerBase, setPriceQuotePerBase] = useState<string>('')
  const [supportedChains, setSupportedChains] = useState<any[]>([])

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

    api
      .getSupportedChains()
      .then((data: any) => {
        setSupportedChains(data.chains || [])
      })
      .catch(console.error)
  }, [])

  const loadAccountState = async (addr: string) => {
    try {
      const state = await api.getAccountState(addr)
      setAccountState(state)
      // Auto-generate deal ID (in production, this would come from backend)
      if (!dealId) {
        setDealId(String(Date.now()))
      }
    } catch (err) {
      console.error('Error loading account state:', err)
    }
  }

  const handleCreateDeal = async () => {
    if (!address || !window.ethereum) {
      alert('Please connect your wallet')
      return
    }

    if (!accountState) {
      alert('Please wait for account to load')
      return
    }

    if (!dealId || !amountBase || !priceQuotePerBase) {
      alert('Please fill in all required fields')
      return
    }

    if (visibility === 'private' && (!taker || !ethers.isAddress(taker))) {
      alert('Please specify a valid taker address for private deals')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const dealIdNum = parseInt(dealId)
      const assetBaseNum = parseInt(assetBase)
      const assetQuoteNum = parseInt(assetQuote)
      const chainIdBaseNum = parseInt(chainIdBase)
      const chainIdQuoteNum = parseInt(chainIdQuote)
      const amountBaseBigInt = parseAmount(amountBase)
      const priceBigInt = parseAmount(priceQuotePerBase)

      // Create transaction payload for signing
      const payload = {
        dealId: dealIdNum,
        visibility: visibility === 'public' ? 'Public' : 'Direct',
        taker: visibility === 'private' ? taker : null,
        assetBase: assetBaseNum,
        assetQuote: assetQuoteNum,
        chainIdBase: chainIdBaseNum,
        chainIdQuote: chainIdQuoteNum,
        amountBase: amountBaseBigInt.toString(),
        priceQuotePerBase: priceBigInt.toString(),
      }

      // Sign transaction
      const nonce = accountState.nonce
      const signature = await signTransactionCorrect(
        signer,
        address,
        nonce,
        'CreateDeal',
        payload
      )

      // Submit transaction
      const submitRequest = {
        kind: 'CreateDeal',
        from: address,
        deal_id: dealIdNum,
        visibility: visibility === 'public' ? 'Public' : 'Direct',
        taker: visibility === 'private' ? taker : null,
        asset_base: assetBaseNum,
        asset_quote: assetQuoteNum,
        chain_id_base: chainIdBaseNum,
        chain_id_quote: chainIdQuoteNum,
        amount_base: amountBaseBigInt.toString(),
        price_quote_per_base: priceBigInt.toString(),
        expires_at: null,
        external_ref: null,
        nonce: nonce,
        signature: signature,
      }

      const result = await api.submitTransaction(submitRequest)
      alert(`Deal created successfully!\nTransaction Hash: ${result.tx_hash}`)

      // Redirect to deal details
      router.push(`/deals/${dealId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create deal')
      console.error('Error creating deal:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Deal</h1>

        {!address ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              Please connect your wallet to create a deal
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal ID
                </label>
                <input
                  type="number"
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as 'public' | 'private')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {visibility === 'private' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taker Address
                  </label>
                  <input
                    type="text"
                    value={taker}
                    onChange={(e) => setTaker(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Asset ID
                  </label>
                  <input
                    type="number"
                    value={assetBase}
                    onChange={(e) => setAssetBase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote Asset ID
                  </label>
                  <input
                    type="number"
                    value={assetQuote}
                    onChange={(e) => setAssetQuote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Chain ID
                  </label>
                  <select
                    value={chainIdBase}
                    onChange={(e) => setChainIdBase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {supportedChains.map((chain) => (
                      <option key={chain.chain_id} value={chain.chain_id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote Chain ID
                  </label>
                  <select
                    value={chainIdQuote}
                    onChange={(e) => setChainIdQuote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {supportedChains.map((chain) => (
                      <option key={chain.chain_id} value={chain.chain_id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Base)
                </label>
                <input
                  type="text"
                  value={amountBase}
                  onChange={(e) => setAmountBase(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (Quote per Base)
                </label>
                <input
                  type="text"
                  value={priceQuotePerBase}
                  onChange={(e) => setPriceQuotePerBase(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeal}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

