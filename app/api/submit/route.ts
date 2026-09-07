import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_URL;
  if (!powerAutomateUrl) {
    return NextResponse.json({ error: "La conexión con Power Automate aún no está configurada." }, { status: 503 });
  }
  const payload = await request.json();
  const planteles = Array.isArray(payload?.municipios)
    ? payload.municipios.flatMap((municipio: { planteles?: unknown[] }) => municipio.planteles ?? [])
    : [];
  const coordenadasInvalidas = planteles.some((plantel: { latitud?: unknown; longitud?: unknown }) => {
    const latitud = Number(plantel.latitud);
    const longitud = Number(plantel.longitud);
    return !Number.isFinite(latitud) || latitud < -90 || latitud > 90 ||
      !Number.isFinite(longitud) || longitud < -180 || longitud > 180;
  });
  if (coordenadasInvalidas) {
    return NextResponse.json(
      { error: "La latitud debe estar entre -90 y 90 y la longitud entre -180 y 180." },
      { status: 400 },
    );
  }
  const response = await fetch(powerAutomateUrl, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!response.ok) return NextResponse.json({ error: "Power Automate rechazó el registro." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
