import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { answers, lead_score, lead_type, intent } = body;

  let path = "evaluation";
  const summary: string[] = [];

  const goal = answers.goal;

  if (goal === "Rejuvenecer mi piel (líneas, manchas, textura)") {
    path = "rejuvenecimiento";
    summary.push("Tratamientos faciales avanzados para rejuvenecimiento de la piel");
  } else if (goal === "Realzar y armonizar la apariencia de mi rostro (labios, pómulos, ojeras)") {
    path = "armonizacion";
    summary.push("Armonización facial y realce de rasgos");
  } else if (goal === "Bajar de peso, desintoxicar y revitalizar mi cuerpo") {
    path = "metabolismo";
    summary.push("Programa de control de peso y detoxificación");
  } else if (goal === "Faciales profesionales y limpieza profunda") {
    path = "facial";
    summary.push("Cuidado profundo y salud de la piel");
  } else if (goal === "Remodelación corporal y tonificación") {
    path = "corporal";
    summary.push("Plan corporal para tonificación y firmeza");
  } else if (goal === "Bienestar hormonal y salud integral") {
    path = "bienestar";
    summary.push("Enfoque holístico de bienestar integral");
  }

  return NextResponse.json({
    path,
    summary,
    lead_score,
    lead_type,
    intent
  });
}
