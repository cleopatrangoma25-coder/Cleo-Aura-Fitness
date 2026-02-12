import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { db } from '../../lib/firebase'
import { captureError } from '../../lib/monitoring'

type UserPlan = 'free' | 'pro'

type ProfileRecord = {
  uid: string
  email: string
  displayName: string
  role: string | null
  plan: UserPlan
}

export function ProUpgradePage({
  user,
  profile,
  onPlanUpdated,
}: {
  user: User
  profile: ProfileRecord
  onPlanUpdated: (plan: UserPlan) => void
}) {
  const navigate = useNavigate()
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [country, setCountry] = useState('US')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedDigits = useMemo(() => cardNumber.replace(/\s+/g, ''), [cardNumber])
  const hasProPlan = profile.plan === 'pro'

  function isValidCardInput() {
    const validCard = /^\d{16}$/.test(normalizedDigits)
    const validExpiry = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
    const validCvc = /^\d{3,4}$/.test(cvc)
    return validCard && validExpiry && validCvc && cardholderName.trim().length > 1
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!isValidCardInput()) {
      setError('Enter a valid card number, expiry (MM/YY), CVC, and cardholder name.')
      return
    }

    setProcessing(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        plan: 'pro',
        billing: {
          provider: 'manual-demo',
          status: 'active',
          country,
          lastPaidAt: serverTimestamp(),
          cardLast4: normalizedDigits.slice(-4),
        },
        updatedAt: serverTimestamp(),
      })
      onPlanUpdated('pro')
      navigate('/app')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to complete payment.'
      setError(message)
      void captureError({
        source: 'manual',
        message,
        stack: caught instanceof Error ? caught.stack : undefined,
        extra: 'pro-upgrade',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (hasProPlan) {
    return (
      <Card className="p-5">
        <h2 className="text-xl font-semibold">You are already on Pro</h2>
        <p className="mt-2 text-sm text-slate-600">Your Pro features are active on this account.</p>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-xl p-5">
      <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
      <p className="mt-1 text-sm text-slate-600">Unlock analytics, wearables, and team features.</p>
      <p className="mt-1 text-sm text-slate-600">Price: $9.99/month</p>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          Cardholder name
          <input
            className="rounded border px-3 py-2"
            onChange={event => setCardholderName(event.target.value)}
            placeholder="Jane Doe"
            required
            value={cardholderName}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Card number
          <input
            className="rounded border px-3 py-2"
            inputMode="numeric"
            maxLength={19}
            onChange={event => setCardNumber(event.target.value)}
            placeholder="4242 4242 4242 4242"
            required
            value={cardNumber}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            Expiry
            <input
              className="rounded border px-3 py-2"
              maxLength={5}
              onChange={event => setExpiry(event.target.value)}
              placeholder="MM/YY"
              required
              value={expiry}
            />
          </label>
          <label className="grid gap-1 text-sm">
            CVC
            <input
              className="rounded border px-3 py-2"
              inputMode="numeric"
              maxLength={4}
              onChange={event => setCvc(event.target.value)}
              placeholder="123"
              required
              value={cvc}
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          Billing country
          <select
            className="rounded border px-3 py-2"
            onChange={event => setCountry(event.target.value)}
            value={country}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button disabled={processing} type="submit">
          {processing ? 'Processing payment...' : 'Pay and Upgrade'}
        </Button>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        Demo payment flow for milestone delivery. Integrate a provider (for example Stripe) before
        production billing.
      </p>
    </Card>
  )
}
