'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Settings, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SubscriptionList from '@/components/subscription/subscription-list'
import SubscriptionForm from '@/components/subscription/subscription-form'
import PaymentHistory from '@/components/subscription/payment-history'
import PaymentForm from '@/components/subscription/payment-form'

type ViewMode = 'list' | 'create' | 'edit' | 'details' | 'payments' | 'add-payment'

export default function SubscriptionManagementPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)

  const handleCreateNew = () => {
    setSelectedSubscription(null)
    setViewMode('create')
  }

  const handleViewDetails = (subscription: any) => {
    setSelectedSubscription(subscription)
    setViewMode('details')
  }

  const handleEdit = (subscription: any) => {
    setSelectedSubscription(subscription)
    setViewMode('edit')
  }

  const handleManagePayments = (subscription: any) => {
    setSelectedSubscription(subscription)
    setViewMode('payments')
  }

  const handleAddPayment = () => {
    setViewMode('add-payment')
  }

  const handleSaveSubscription = async (data: any) => {
    try {
      const url = data.id 
        ? `/api/super-admin/subscriptions/${data.id}`
        : '/api/super-admin/subscriptions'
      
      const method = data.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setViewMode('list')
        // Refresh the list or show success message
      } else {
        console.error('Failed to save subscription:', result.message)
        // Show error message
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      // Show error message
    }
  }

  const handleSavePayment = async (data: any) => {
    try {
      const response = await fetch(`/api/super-admin/subscriptions/${selectedSubscription.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setViewMode('payments')
        // Refresh payment history
      } else {
        console.error('Failed to save payment:', result.message)
        // Show error message
      }
    } catch (error) {
      console.error('Error saving payment:', error)
      // Show error message
    }
  }

  const handleCheckExpired = async () => {
    try {
      const response = await fetch('/api/super-admin/subscriptions/check-expired', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        // Show success message with expired count
        console.log(`Checked expired subscriptions: ${result.expiredCount} expired`)
      } else {
        console.error('Failed to check expired subscriptions:', result.message)
      }
    } catch (error) {
      console.error('Error checking expired subscriptions:', error)
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <SubscriptionList
            onCreateNew={handleCreateNew}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onManagePayments={handleManagePayments}
          />
        )
      
      case 'create':
        return (
          <SubscriptionForm
            onSave={handleSaveSubscription}
            onCancel={() => setViewMode('list')}
            mode="create"
          />
        )
      
      case 'edit':
        return (
          <SubscriptionForm
            subscription={selectedSubscription}
            onSave={handleSaveSubscription}
            onCancel={() => setViewMode('list')}
            mode="edit"
          />
        )
      
      case 'details':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Subscription Details</h2>
                  <p className="text-gray-600">
                    {selectedSubscription?.admins?.full_name} - {selectedSubscription?.plan_type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(selectedSubscription)}
                >
                  Edit Subscription
                </Button>
                <Button
                  onClick={() => handleManagePayments(selectedSubscription)}
                >
                  Manage Payments
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admin</label>
                    <p className="font-medium">{selectedSubscription?.admins?.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedSubscription?.admins?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Type</label>
                    <Badge className="ml-2">{selectedSubscription?.plan_type}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge 
                      variant={selectedSubscription?.status === 'ACTIVE' ? 'default' : 'destructive'}
                      className="ml-2"
                    >
                      {selectedSubscription?.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p>{new Date(selectedSubscription?.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                    <p>
                      {selectedSubscription?.expiry_date 
                        ? new Date(selectedSubscription.expiry_date).toLocaleDateString()
                        : 'Lifetime'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Auto Renew</label>
                    <Badge variant={selectedSubscription?.auto_renew ? 'default' : 'outline'} className="ml-2">
                      {selectedSubscription?.auto_renew ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <Badge 
                      variant={selectedSubscription?.payment_status === 'PAID' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {selectedSubscription?.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                    <p className="font-medium">PKR {selectedSubscription?.amount_paid_pkr?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Price</label>
                    <p className="font-medium">PKR {selectedSubscription?.subscription_plans?.price_pkr?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Transaction Reference</label>
                    <p className="font-mono text-sm">
                      {selectedSubscription?.transaction_reference || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Date</label>
                    <p>
                      {selectedSubscription?.payment_date 
                        ? new Date(selectedSubscription.payment_date).toLocaleDateString()
                        : 'Not paid'
                      }
                    </p>
                  </div>
                  {selectedSubscription?.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-sm">{selectedSubscription.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setViewMode('details')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Details
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Payment Management</h2>
                  <p className="text-gray-600">
                    {selectedSubscription?.admins?.full_name} - {selectedSubscription?.plan_type}
                  </p>
                </div>
              </div>
            </div>

            <PaymentHistory
              subscriptionId={selectedSubscription?.id}
              onAddPayment={handleAddPayment}
            />
          </div>
        )
      
      case 'add-payment':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setViewMode('payments')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Payments
              </Button>
              <div>
                <h2 className="text-2xl font-bold">Add Payment Record</h2>
                <p className="text-gray-600">
                  {selectedSubscription?.admins?.full_name} - {selectedSubscription?.plan_type}
                </p>
              </div>
            </div>

            <PaymentForm
              subscriptionId={selectedSubscription?.id}
              onSave={handleSavePayment}
              onCancel={() => setViewMode('payments')}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-gray-600">Manage admin subscriptions, payments, and renewals</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckExpired}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Check Expired
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/super-admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
