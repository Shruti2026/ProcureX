import { useQuery } from '@tanstack/react-query'
import { Building2, Package, FileText, BarChart2, Loader2 } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import { useAuth } from '../../context/AuthContext'
import { getMyVendorProfile, getMyVendorProducts } from '../../services/vendorService'
import { getMyInvitations } from '../../services/rfqService'
import { formatDate } from '../../utils/formatters'

/* ─────────────────────────────────────────
   VendorDashboard
───────────────────────────────────────── */
export default function VendorDashboard() {
  const { user } = useAuth()

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: getMyVendorProfile,
  })

  const {
    data: invitations,
    isLoading: invitationsLoading,
  } = useQuery({
    queryKey: ['vendor-invitations', profile?.vendorId],
    queryFn: () => getMyInvitations({ vendorId: profile.vendorId, size: 5 }),
    enabled: !!profile?.vendorId,
  })

  const {
    data: vendorProducts,
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ['vendor-products', profile?.vendorId],
    queryFn: () => getMyVendorProducts(profile.vendorId),
    enabled: !!profile?.vendorId,
  })

  const isLoading = profileLoading || invitationsLoading || productsLoading

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-gray-500">Failed to load vendor profile.</p>
      </div>
    )
  }

  const invitationList = Array.isArray(invitations)
    ? invitations
    : invitations?.content ?? []

  const productList = Array.isArray(vendorProducts)
    ? vendorProducts
    : vendorProducts?.content ?? []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your vendor profile, invitations, and product catalog.
        </p>
      </div>

      {/* 4-card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1 — Vendor Profile */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Vendor Profile</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xl font-bold text-gray-900">{profile.companyName}</p>
              <div className="mt-1">
                <Badge status={profile.vendorStatus} />
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 text-gray-500">Contact</dt>
                <dd className="text-gray-800 font-medium">{profile.contactPerson ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 text-gray-500">Email</dt>
                <dd className="text-gray-800 font-medium">{profile.email ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 text-gray-500">Phone</dt>
                <dd className="text-gray-800 font-medium">{profile.phoneNumber ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 text-gray-500">Registration</dt>
                <dd className="text-gray-800 font-medium">{profile.registrationNumber ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Card 2 — RFQ Invitations */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">RFQ Invitations</h2>
          </div>

          {invitationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
            </div>
          ) : invitationList.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No active invitations</p>
          ) : (
            <Table
              columns={['RFQ Number', 'Requisition', 'Closing Date', 'Status']}
            >
              {invitationList.map((inv) => (
                <tr key={inv.invitationId ?? inv.rfqId} className="hover:bg-gray-50 transition-colors duration-100">
                  <Table.Td className="font-mono text-xs text-gray-500">
                    {inv.rfqNumber ?? inv.rfq?.rfqNumber ?? '—'}
                  </Table.Td>
                  <Table.Td className="max-w-[140px] truncate">
                    {inv.requisitionTitle ?? inv.rfq?.requisitionTitle ?? '—'}
                  </Table.Td>
                  <Table.Td>{formatDate(inv.closingDate ?? inv.rfq?.closingDate)}</Table.Td>
                  <Table.Td>
                    <Badge status={inv.status} />
                  </Table.Td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {/* Card 3 — My Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">My Product Catalog</h2>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
            </div>
          ) : productList.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No products listed</p>
          ) : (
            <Table
              columns={['Product Name', 'Vendor Price', 'Lead Time (days)', 'Status']}
            >
              {productList.map((vp) => (
                <tr key={vp.vendorProductId ?? vp.id} className="hover:bg-gray-50 transition-colors duration-100">
                  <Table.Td className="font-medium text-gray-900">
                    {vp.productName ?? vp.product?.productName ?? '—'}
                  </Table.Td>
                  <Table.Td>{vp.vendorPrice != null ? `₹${vp.vendorPrice}` : '—'}</Table.Td>
                  <Table.Td>{vp.leadTimeDays ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge status={vp.status ?? (vp.isActive ? 'ACTIVE' : 'INACTIVE')} />
                  </Table.Td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {/* Card 4 — Quotations placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <BarChart2 className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Quotations</h2>
          </div>
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-sm text-gray-400">
              Quotation management will be available in Day 5.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
