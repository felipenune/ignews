import { stripe } from "@/services/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";
import { Readable } from 'stream'
import Stripe from "stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
  const chuncks = []

  for await (const chunck of readable) {
    chuncks.push(
      typeof chunck === "string" ? Buffer.from(chunck) : chunck
    )
  }

  return Buffer.concat(chuncks)
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
])

export default async(req: NextApiRequest, res: NextApiResponse) => {
  if(req.method !== 'POST') {    
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method not allowed')
  }
  
  const buff = await buffer(req)
  const secret = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buff, secret, webhookSecret)
  } catch (error: any) {
    return res.status(400).send(`Webhook error: ${error.message}`)
  }

  const { type } = event

  if (relevantEvents.has(type)) {
    try {
      switch (type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription
          await saveSubscription(
            subscription.id,
            subscription.customer.toString(),
            false
          )
          break;
        case 'checkout.session.completed':   
          const checkoutSession = event.data.object as Stripe.Checkout.Session
          await saveSubscription(
            checkoutSession.subscription?.toString() as string,
            checkoutSession.customer?.toString() as string,
            true
          )
          break;      
        default:
          throw new Error('Unhandled event.');
      }
    } catch (error: any){
      return res.json({ error: 'Webhook handler failed' })
    }
  }

  res.json({ received: true })
}