import Layout from '@/components/Layout'

export default function DealDetails({
  params,
}: {
  params: { dealId: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Deal Details: {params.dealId}
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Deal details page - Coming soon</p>
        </div>
      </div>
    </Layout>
  )
}

