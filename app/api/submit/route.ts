import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_URL;
  if (!powerAutomateUrl) {
    return NextResponse.json({ error: "La conexión con Power Automate aún no está configurada." }, { status: 503 });
  }
  const payload = await request.json();
  const response = await fetch(powerAutomateUrl, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!response.ok) return NextResponse.json({ error: "Power Automate rechazó el registro." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
