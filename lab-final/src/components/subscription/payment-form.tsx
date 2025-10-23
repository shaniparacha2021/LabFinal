'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Save, X } from 'lucide-react'
import { format } from 'date-fns'

interface PaymentFormProps {
  subscriptionId: string
  onSave: (data: any) => void
  onCancel: () => void
}

export default function PaymentForm({ subscriptionId, onSave, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    amountPkr: 0,
    paymentStatus: 'PENDING',
    transactionReference: '',
    paymentMethod: '',
    paymentDate: new Date(),
    dueDate: new Date(),
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.amountPkr <= 0) {
      newErrors.amountPkr = 'Amount must be greater than 0'
    }

    if (!formData.paymentStatus) {
      newErrors.paymentStatus = 'Payment status is required'
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
        paymentDate: formData.paymentDate.toISOString(),
        dueDate: formData.dueDate.toISOString()
      }

      await onSave(submitData)
    } catch (error) {
      console.error('Error saving payment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Payment Record</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amountPkr">Amount (PKR) *</Label>
            <Input
              id="amountPkr"
              type="number"
              value={formData.amountPkr}
              onChange={(e) => setFormData(prev => ({ ...prev, amountPkr: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              step="0.01"
            />
            {errors.amountPkr && <p className="text-sm text-red-600">{errors.amountPkr}</p>}
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status *</Label>
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
            {errors.paymentStatus && <p className="text-sm text-red-600">{errors.paymentStatus}</p>}
          </div>

          {/* Transaction Reference */}
          <div className="space-y-2">
            <Label htmlFor="transactionReference">Transaction Reference</Label>
            <Input
              id="transactionReference"
              value={formData.transactionReference}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionReference: e.target.value }))}
              placeholder="Enter transaction reference"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
                <SelectItem value="ONLINE">Online Payment</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.paymentDate ? format(formData.paymentDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.paymentDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, paymentDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, dueDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this payment"
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
              {loading ? 'Saving...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
