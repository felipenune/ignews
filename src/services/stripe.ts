import Stripe from "stripe";
import pg from '../../package.json'

const apiKey: string = process.env.STRIPE_API_KEY as string

export const stripe = new Stripe(
  apiKey,
  {
    apiVersion: "2022-11-15",
    appInfo: {
      name: 'Ignews',
      version: pg.version
    }
  }
)