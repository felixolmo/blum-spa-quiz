import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    await fetch("https://hook.us2.make.com/9wz5il6bfj651qsd978ibb58iih8gish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "Blum Spa Quiz",
        lead: data.lead,
        answers: data.answers,
        result: data.result
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead webhook error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
