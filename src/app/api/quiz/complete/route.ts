import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { answers } = await req.json();

  let path = "evaluation";
  const summary: string[] = [];

  const goal = answers.goal;

  if (goal === "Rejuvenecer mi piel") {
    path = "rejuvenecimiento";
    summary.push("Tratamientos faciales avanzados para rejuvenecimiento de la piel");
  } else if (goal === "Mejorar la apariencia de mi rostro") {
    path = "armonizacion";
    summary.push("Armonización facial y realce de rasgos");
  } else if (goal === "Bajar de peso o desintoxicar mi cuerpo") {
    path = "metabolismo";
    summary.push("Programa de control de peso y detoxificación");
  } else if (goal === "Tratamientos faciales y limpieza profunda") {
    path = "facial";
    summary.push("Cuidado profundo y salud de la piel");
  } else if (goal === "Remodelación corporal o tonificación") {
    path = "corporal";
    summary.push("Plan corporal para tonificación y firmeza");
  } else if (goal === "Bienestar hormonal y salud integral") {
    path = "bienestar";
    summary.push("Enfoque holístico de bienestar integral");
  }

  return NextResponse.json({ path, summary });
}
