'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { api, AccountState } from '@/services/api'
import { ethers } from 'ethers'
import {
  formatAddress,
  formatAmount,
  parseAmount,
  signTransactionCorrect,
} from '@/utils/transactions'

export default function Deposits() {
  const [address, setAddress] = useState<string | null>(null)
  const [accountState, setAccountState] = useState<AccountState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assetId, setAssetId] = useState<string>('1')
  const [amount, setAmount] = useState<string>('')
  const [chainId, setChainId] = useState<string>('8453') // Base
  const [depositContract, setDepositContract] = useState<string>('')
  const [supportedChains, setSupportedChains] = useState<any[]>([])

  useEffect(() => {
    // Get address from window.ethereum
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

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          loadAccountState(accounts[0])
        } else {
          setAddress(null)
          setAccountState(null)
        }
      })
    }

    // Load supported chains
    api
      .getSupportedChains()
      .then((data: any) => {
        setSupportedChains(data.chains || [])
      })
      .catch((err: any) => {
        console.error('Error loading supported chains:', err)
        // Set default chains if API fails
        setSupportedChains([
          { chain_id: 11155111, name: 'Ethereum Sepolia' },
          { chain_id: 84532, name: 'Base Sepolia' },
        ])
      })
  }, [])

  const loadAccountState = async (addr: string) => {
    setLoading(true)
    setError(null)
    try {
      const state = await api.getAccountState(addr)
      setAccountState(state)
    } catch (err: any) {
      console.log('loadAccountState error:', err)
      console.log('Error response:', err.response)
      console.log('Error status:', err.response?.status)
      
      // Handle 404 (account not found) as a normal case, not an error
      if (err.response?.status === 404 || err.code === 'ERR_BAD_REQUEST') {
        // Account doesn't exist yet - this is normal for new accounts
        console.log('Account not found, creating empty account state')
        setAccountState({
          account_id: addr,
          owner: addr,
          balances: [],
          nonce: 0,
        })
        setError(null)
      } else {
        // Real error
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load account state'
        setError(errorMessage)
        console.error('Error loading account state:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!address || !window.ethereum) {
      alert('Please connect your wallet')
      return
    }

    if (!accountState) {
      alert('Please wait for account to load')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!depositContract || !ethers.isAddress(depositContract)) {
      alert('Please enter a valid deposit contract address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        depositContract,
        [
          'function deposit(uint256 assetId, uint256 amount) external',
          'function depositNative(uint256 assetId) external payable',
          'event Deposit(address indexed user, uint256 indexed assetId, uint256 amount, bytes32 indexed txHash)',
        ],
        signer
      )

      const amountWei = parseAmount(amount)
      const assetIdNum = parseInt(assetId)
      const chainIdNum = parseInt(chainId)

      // Step 1: Call deposit on L1 contract
      const tx = await contract.deposit(assetIdNum, amountWei)
      const receipt = await tx.wait()

      // Step 2: Get tx_hash from receipt
      const txHash = receipt.hash

      // Step 3: Create and sign deposit transaction for sequencer
      const nonce = accountState.nonce
      const payload = {
        txHash: txHash,
        account: address,
        assetId: assetIdNum,
        amount: amountWei.toString(),
        chainId: chainIdNum,
      }

      const signature = await signTransactionCorrect(
        signer,
        address,
        nonce,
        'Deposit',
        payload
      )

      // Step 4: Submit transaction to sequencer
      const submitRequest = {
        from: address,
        nonce: nonce,
        kind: 'Deposit',
        payload: {
          tx_hash: txHash,
          account: address,
          assetId: assetIdNum,
          amount: amountWei.toString(),
          chainId: chainIdNum,
        },
        signature: signature,
      }

      const result = await api.submitTransaction(
        submitRequest.from,
        submitRequest.nonce,
        submitRequest.kind,
        submitRequest.payload,
        submitRequest.signature
      )
      alert(`Deposit submitted successfully!\nTransaction Hash: ${result.tx_hash}`)

      // Reload account state
      await loadAccountState(address)
    } catch (err: any) {
      setError(err.message || 'Failed to process deposit')
      console.error('Error processing deposit:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Deposits</h1>

        {!address ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              Please connect your wallet to make deposits
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Address: </span>
                  <span className="font-mono">{formatAddress(address)}</span>
                </div>
                {accountState && (
                  <div>
                    <span className="text-gray-600">Nonce: </span>
                    <span>{accountState.nonce}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deposit Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">New Deposit</h2>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Contract Address
                  </label>
                  <input
                    type="text"
                    value={depositContract}
                    onChange={(e) => setDepositContract(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset ID
                  </label>
                  <input
                    type="number"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chain ID
                  </label>
                  <select
                    value={chainId}
                    onChange={(e) => setChainId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {supportedChains.map((chain) => (
                      <option key={chain.chain_id} value={chain.chain_id}>
                        {chain.name} ({chain.chain_id})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={loading || !amount || !depositContract}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Deposits are processed on-chain. After
                  calling the deposit function on the contract, the watcher will
                  automatically create a deposit transaction in ZKClear.
                </p>
              </div>
            </div>

            {/* Current Balances */}
            {accountState && accountState.balances.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Current Balances</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chain ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accountState.balances.map((balance, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {balance.asset_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {balance.chain_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatAmount(BigInt(balance.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
