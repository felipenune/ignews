import { fauna } from "@/services/fauna";
import { stripe } from "@/services/stripe";
import { Casefold, query } from "faunadb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

type User = {
  ref: {
    id: string
  },
  data: {
    stripe_customer_id: string
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if(req.method !== 'POST') {
    console.log('teste')
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method not allowed')
  }

  const session = await getSession({ req })

  const user = await fauna.query<User>(
    query.Get(
      query.Match(
        query.Index('user_by_email'),
        query.Casefold(session?.user?.email as string)
      )
    )
  )

  let customerId = user.data.stripe_customer_id

  if(!customerId) {
    const customer = await stripe.customers.create({
      email: session?.user?.email as string
    })
  
    await fauna.query(
      query.Update(
        query.Ref(
          query.Collection('users'),
          user.ref.id
        ),
        {
          data: {
            stripe_customer_id: customer.id
          }
        }
      )
    )

    customerId = customer.id
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    line_items: [
      { price: 'price_1MZMkcDxA8zOgheUyhRg9YhW', quantity: 1 }
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: process.env.STRIPE_SUCCESS_URL as string,
    cancel_url: process.env.STRIPE_CANCEL_URL as string
  })

  return res.status(200).json({ sessionId: checkoutSession.id })
}