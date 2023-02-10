import { api } from '@/services/api'
import { getStripeJs } from '@/services/stripe-client'
import { signIn, useSession } from 'next-auth/react'
import { ApiError } from 'next/dist/server/api-utils'
import { Exception } from 'sass'
import styles from './styles.module.scss'

interface SubscribeButtonProps {
  priceId: string
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const { data: session } = useSession()
  
  async function handleSubscribe() {
    if(!session) {
      signIn('github')
      return
    }

    try {
      const response = await api.post('/subscribe')

      const { sessionId } = response.data

      const stripe = await getStripeJs()

      await stripe?.redirectToCheckout({
        sessionId
      })
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe now
    </button>
  )
}