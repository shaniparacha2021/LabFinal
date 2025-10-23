'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Save, X } from 'lucide-react'
import { format } from 'date-fns'

interface Admin {
  id: string
  full_name: string
  username: string
  email: string
  mobile_number: string
  is_active: boolean
}

interface SubscriptionPlan {
  id: string
  plan_name: string
  display_name: string
  description: string
  price_pkr: number
  duration_days: number
  features: any
}

interface SubscriptionFormProps {
  subscription?: any
  onSave: (data: any) => void
  onCancel: () => void
  mode: 'create' | 'edit'
}

export default function SubscriptionForm({
  subscription,
  onSave,
  onCancel,
  mode
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState({
    adminId: '',
    planType: '',
    startDate: new Date(),
    autoRenew: false,
    amountPaid: 0,
    transactionReference: '',
    paymentStatus: 'PENDING',
    notes: ''
  })
  const [admins, setAdmins] = useState<Admin[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAdmins()
    fetchPlans()
    
    if (subscription && mode === 'edit') {
      setFormData({
        adminId: subscription.admin_id,
        planType: subscription.plan_type,
        startDate: new Date(subscription.start_date),
        autoRenew: subscription.auto_renew,
        amountPaid: subscription.amount_paid_pkr || 0,
        transactionReference: subscription.transaction_reference || '',
        paymentStatus: subscription.payment_status,
        notes: subscription.notes || ''
      })
    }
  }, [subscription, mode])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/super-admin/admins')
      const data = await response.json()
      if (response.ok) {
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/super-admin/subscription-plans')
      const data = await response.json()
      if (response.ok) {
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.adminId) {
      newErrors.adminId = 'Admin is required'
    }

    if (!formData.planType) {
      newErrors.planType = 'Plan type is required'
    }

    if (formData.amountPaid < 0) {
      newErrors.amountPaid = 'Amount cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate.toISOString()
      }

      if (mode === 'edit' && subscription) {
        // For edit mode, we need to handle updates differently
        await onSave({
          id: subscription.id,
          ...submitData
        })
      } else {
        await onSave(submitData)
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = plans.find(plan => plan.plan_name === formData.planType)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Subscription' : 'Edit Subscription'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Admin Selection */}
          <div className="space-y-2">
            <Label htmlFor="adminId">Admin *</Label>
            <Select
              value={formData.adminId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, adminId: value }))}
              disabled={mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an admin" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.full_name} ({admin.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.adminId && <p className="text-sm text-red-600">{errors.adminId}</p>}
          </div>

          {/* Plan Type */}
          <div className="space-y-2">
            <Label htmlFor="planType">Plan Type *</Label>
            <Select
              value={formData.planType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, planType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.plan_name}>
                    {plan.display_name} - PKR {plan.price_pkr.toLocaleString()}
                    {plan.duration_days > 0 && ` (${plan.duration_days} days)`}
                    {plan.duration_days === 0 && ' (Lifetime)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planType && <p className="text-sm text-red-600">{errors.planType}</p>}
            {selectedPlan && (
              <div className="text-sm text-gray-600">
                <p><strong>Description:</strong> {selectedPlan.description}</p>
                <p><strong>Price:</strong> PKR {selectedPlan.price_pkr.toLocaleString()}</p>
                {selectedPlan.features && Object.keys(selectedPlan.features).length > 0 && (
                  <p><strong>Features:</strong> {JSON.stringify(selectedPlan.features)}</p>
                )}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Auto Renew */}
          <div className="flex items-center space-x-2">
            <Switch
              id="autoRenew"
              checked={formData.autoRenew}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoRenew: checked }))}
            />
            <Label htmlFor="autoRenew">Auto Renew</Label>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (PKR)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
                {errors.amountPaid && <p className="text-sm text-red-600">{errors.amountPaid}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionReference">Transaction Reference</Label>
              <Input
                id="transactionReference"
                value={formData.transactionReference}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionReference: e.target.value }))}
                placeholder="Enter transaction reference"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this subscription"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : mode === 'create' ? 'Create Subscription' : 'Update Subscription'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
