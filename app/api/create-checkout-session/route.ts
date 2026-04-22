import { NextResponse } from "next/server";

// Since we are mocking for testing, we'll just simulate a session creation
// In a real app, you would use:
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(_req: Request) {
  try {
    // Consume the request body (hours, etc.) — placeholder for actual Stripe logic
    await _req.json();

    // Placeholder for actual Stripe Checkout Session logic
    // const session = await stripe.checkout.sessions.create({ ... });

    return NextResponse.json({ 
      id: "mock_session_id",
      url: "/reserve/success" // For now, redirect directly to success in dev
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
