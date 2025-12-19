import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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
    const response = await apiClient.get(`/api/v1/account/${address}`)
    return response.data
  },

  async getAccountBalance(address: string, assetId: number): Promise<Balance> {
    const response = await apiClient.get(
      `/api/v1/account/${address}/balance/${assetId}`
    )
    return response.data
  },

  // Deal endpoints
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
}

export default api

