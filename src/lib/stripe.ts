import Stripe from "stripe";
import { env } from "~/env";

// Amounts in cents
export const DONATION_AMOUNTS = [
  { value: 1000, label: "$10" },
  { value: 2000, label: "$20" },
  { value: 5000, label: "$50" },
  { value: 10000, label: "$100" },
  { value: 25000, label: "$250" },
  { value: 99999900, label: "$999K" },
];

export const DEFAULT_DONATION_AMOUNT = DONATION_AMOUNTS.at(-1)?.value ?? 2000; // last item in the array

// Create Stripe instance

export async function createCheckoutSession(
  amount: number,
  successUrl: string,
  cancelUrl: string,
) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "afterpay_clearpay", "klarna"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Donation to WikiClone",
            description: "Thank you for supporting our project!",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
