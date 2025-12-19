import { ethers } from 'ethers'

export interface DepositParams {
  txHash: string
  account: string
  assetId: number
  amount: bigint
  chainId: number
}

export interface WithdrawParams {
  assetId: number
  amount: bigint
  to: string
  chainId: number
}

export interface CreateDealParams {
  dealId: number
  visibility: 'public' | 'private'
  taker?: string
  assetBase: number
  assetQuote: number
  chainIdBase: number
  chainIdQuote: number
  amountBase: bigint
  priceQuotePerBase: bigint
}

export interface AcceptDealParams {
  dealId: number
  amount?: bigint
}

export interface CancelDealParams {
  dealId: number
}

/**
 * Create transaction hash for signing (Ethereum message format)
 */
export function createTxHash(
  from: string,
  nonce: number,
  kind: string,
  payload: any
): string {
  const message = ethers.solidityPackedKeccak256(
    ['address', 'uint64', 'uint8', 'bytes'],
    [
      from,
      nonce,
      getKindByte(kind),
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes'],
        [ethers.toUtf8Bytes(JSON.stringify(payload))]
      ),
    ]
  )

  // Ethereum signed message prefix
  const prefix = '\x19Ethereum Signed Message:\n' + String(message.length)
  return ethers.solidityPackedKeccak256(
    ['string', 'bytes32'],
    [prefix, message]
  )
}

function getKindByte(kind: string): number {
  switch (kind) {
    case 'Deposit':
      return 0
    case 'Withdraw':
      return 1
    case 'CreateDeal':
      return 2
    case 'AcceptDeal':
      return 3
    case 'CancelDeal':
      return 4
    default:
      throw new Error(`Unknown transaction kind: ${kind}`)
  }
}

/**
 * Sign transaction with wallet
 */
export async function signTransaction(
  signer: ethers.Signer,
  from: string,
  nonce: number,
  kind: string,
  payload: any
): Promise<string> {
  const messageHash = createTxHash(from, nonce, kind, payload)
  const signature = await signer.signMessage(ethers.getBytes(messageHash))
  return signature
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format amount with decimals
 */
export function formatAmount(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals)
}

/**
 * Parse amount from string
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals)
}

