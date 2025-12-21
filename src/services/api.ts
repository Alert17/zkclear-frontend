import axios from 'axios'

// For client-side requests, we need to use the full backend URL
// Next.js rewrites only work for server-side requests
const API_BASE_URL = 
  typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
    : 'http://localhost:3000' // Server-side can use direct URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface AccountState {
  account_id: string
  owner: string
  balances: Balance[]
  nonce: number
}

export interface Balance {
  asset_id: number
  amount: string
  chain_id: number
}

export interface Deal {
  deal_id: number
  maker: string
  taker: string | null
  asset_base: number
  asset_quote: number
  chain_id_base: number
  chain_id_quote: number
  amount_base: string
  amount_remaining?: string
  price_quote_per_base: string
  visibility: 'public' | 'private'
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  created_at?: number
  expires_at?: number | null
  is_cross_chain?: boolean
}

export interface Block {
  id: number
  timestamp: number
  transactions: any[]
  state_root: string
  withdrawals_root: string
  block_proof: string
}

export interface QueueStatus {
  queue_length: number
  max_queue_size: number
}

export interface Chain {
  chain_id: number
  name: string
}

// API functions
export const api = {
  // Health check
  async healthCheck() {
    const response = await apiClient.get('/health')
    return response.data
  },

  // Account endpoints
  async getAccountState(address: string): Promise<AccountState> {
    try {
      const response = await apiClient.get(`/api/v1/account/${address}`)
      return response.data
    } catch (error: any) {
      // If account not found (404), throw with response info for proper handling
      if (error.response?.status === 404) {
        throw error // Re-throw so caller can handle it
      }
      throw error
    }
  },

  async getAccountBalance(address: string, assetId: number): Promise<Balance> {
    const response = await apiClient.get(
      `/api/v1/account/${address}/balance/${assetId}`
    )
    return response.data
  },

  // Deal endpoints
  async getDealsList(params?: {
    status?: string
    address?: string
    visibility?: string
  }): Promise<{ deals: Deal[]; total: number }> {
    const response = await apiClient.get('/api/v1/deals', { params })
    return response.data
  },

  async getDealDetails(dealId: number): Promise<Deal> {
    const response = await apiClient.get(`/api/v1/deal/${dealId}`)
    return response.data
  },

  // Block endpoints
  async getBlockInfo(blockId: number): Promise<Block> {
    const response = await apiClient.get(`/api/v1/block/${blockId}`)
    return response.data
  },

  // Queue status
  async getQueueStatus(): Promise<QueueStatus> {
    const response = await apiClient.get('/api/v1/queue/status')
    return response.data
  },

  // Supported chains
  async getSupportedChains(): Promise<Chain[]> {
    const response = await apiClient.get('/api/v1/chains')
    return response.data
  },

  // JSON-RPC
  async jsonRpc(method: string, params: any[] = []) {
    const response = await apiClient.post('/jsonrpc', {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    })
    return response.data
  },

  // Submit transaction
  async submitTransaction(
    from: string,
    nonce: number,
    kind: string,
    payload: any,
    signature: string
  ) {
    const response = await apiClient.post('/api/v1/transactions', {
      from,
      nonce,
      kind,
      payload,
      signature,
    })
    return response.data
  },
}

export default api

