'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, CreditCard, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface Payment {
  id: string
  subscription_id: string
  admin_id: string
  amount_pkr: number
  payment_status: 'PAID' | 'PENDING' | 'OVERDUE' | 'FAILED' | 'REFUNDED'
  transaction_reference: string | null
  payment_method: string | null
  payment_date: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  admins: {
    id: string
    full_name: string
    email: string
  }
}

interface PaymentHistoryProps {
  subscriptionId: string
  onAddPayment: () => void
}

export default function PaymentHistory({ subscriptionId, onAddPayment }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [statistics, setStatistics] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalPayments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [subscriptionId])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/subscriptions/${subscriptionId}/payments`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments || [])
        setStatistics(data.statistics || {})
      } else {
        console.error('Failed to fetch payments:', data.message)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PAID': 'default',
      'PENDING': 'secondary',
      'OVERDUE': 'destructive',
      'FAILED': 'destructive',
      'REFUNDED': 'outline'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-gray-600">Track all payments for this subscription</p>
        </div>
        <Button onClick={onAddPayment} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              PKR {statistics.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              PKR {statistics.totalPending.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              PKR {statistics.totalOverdue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payment records found</p>
              <Button onClick={onAddPayment} className="mt-4">
                Add First Payment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction Ref</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">
                        PKR {payment.amount_pkr.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(payment.payment_status)}
                    </TableCell>
                    <TableCell>
                      {payment.transaction_reference ? (
                        <div className="font-mono text-sm">
                          {payment.transaction_reference}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.payment_method || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      {payment.payment_date ? (
                        <div>
                          <div className="font-medium">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(payment.payment_date), 'HH:mm')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.due_date ? (
                        <div>
                          <div className="font-medium">
                            {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                          </div>
                          {new Date(payment.due_date) < new Date() && payment.payment_status !== 'PAID' && (
                            <div className="text-sm text-red-600">Overdue</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.notes ? (
                        <div className="max-w-xs truncate" title={payment.notes}>
                          {payment.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
