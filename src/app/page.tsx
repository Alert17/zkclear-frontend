import Link from 'next/link'
import Layout from '@/components/Layout'

export default function Home() {
  return (
    <Layout>
      <div className="px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ZKClear
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Institutional OTC Settlement Platform with Zero-Knowledge Guarantees
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Deposits</h2>
              <p className="text-gray-600 mb-4">
                Deposit assets from L1 chains to start trading
              </p>
              <Link
                href="/deposits"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Go to Deposits →
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Deals</h2>
              <p className="text-gray-600 mb-4">
                Create and manage OTC settlement deals
              </p>
              <Link
                href="/deals"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Go to Deals →
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Withdrawals</h2>
              <p className="text-gray-600 mb-4">
                Withdraw your assets back to L1 chains
              </p>
              <Link
                href="/withdrawals"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Go to Withdrawals →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

