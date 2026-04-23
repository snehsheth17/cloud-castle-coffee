import Stripe from 'stripe'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    const { email } = req.body

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) return res.status(200).json({ invoices: [], subscription: null })

    const customer = customers.data[0]

    // Get invoices
    const invoices = await stripe.invoices.list({ customer: customer.id, limit: 12 })

    // Get subscription
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 1 })
    const subscription = subscriptions.data[0] || null

    res.status(200).json({
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        amount: inv.amount_paid,
        status: inv.status,
        date: inv.created,
        pdf: inv.invoice_pdf,
      })),
      subscription: subscription ? {
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      } : null,
    })
  } catch (err) {
    console.error('Billing error:', err.message)
    res.status(500).json({ error: err.message })
  }
}