"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import Image from "next/image";

type Q = {
  id: string;
  label: string;
  type: "choice" | "text";
  options?: string[];
};

const QUESTIONS: Q[] = [
  {
    id: "goal",
    label: "¿Qué te gustaría mejorar o trabajar en este momento?",
    type: "choice",
    options: [
      "Rejuvenecer mi piel (líneas, manchas, textura)",
      "Realzar y armonizar la apariencia de mi rostro (labios, pómulos, ojeras)",
      "Bajar de peso, desintoxicar y revitalizar mi cuerpo",
      "Faciales profesionales y limpieza profunda",
      "Remodelación corporal y tonificación",
      "Bienestar hormonal y salud integral",
      "No estoy segura(o) y me gustaría recibir orientación profesional"
    ]
  },
  {
    id: "area",
    label: "¿En qué área deseas enfocarte principalmente?",
    type: "choice",
    options: [
      "Rostro",
      "Labios",
      "Ojeras",
      "Pómulos",
      "Cuello / Papada",
      "Cuerpo",
      "Peso y metabolismo",
      "Bienestar general"
    ]
  },
  {
    id: "concern",
    label: "¿Cuál de las siguientes preocupaciones te identifica más en este momento?",
    type: "choice",
    options: [
      "Arrugas o líneas de expresión",
      "Manchas, hiperpigmentación o melasma",
      "Flacidez y pérdida de firmeza",
      "Poros abiertos o textura irregular de la piel",
      "Ojeras y aspecto cansado",
      "Acné, cicatrices o marcas",
      "Grasa localizada",
      "Retención de líquidos o inflamación",
      "Cansancio, estrés o falta de energía"
    ]
  },
  {
    id: "experience",
    label: "¿Has recibido tratamientos estéticos anteriormente?",
    type: "choice",
    options: [
      "Sí, tratamientos estéticos avanzados",
      "Sí, tratamientos estéticos básicos",
      "No, sería mi primera vez",
      "Prefiero opciones holísticas y no invasivas"
    ]
  },
  {
    id: "preference",
    label: "¿Qué tipo de tratamiento te interesa o prefieres en este momento?",
    type: "choice",
    options: [
      "Tratamientos no invasivos (faciales, radiofrecuencia, LED, hidrofacial)",
      "Inyectables estéticos (Botox, toxina botulínica, ácido hialurónico, bioestimuladores)",
      "Tecnología avanzada (HIFU, láser, microagujas)",
      "Enfoque holístico y detox (ozono, vitaminas, sauna)",
      "Prefiero que el especialista me recomiende la mejor opción para mí"
    ]
  },
  { id: "name", label: "Nombre completo", type: "text" },
  { id: "email", label: "Correo electrónico", type: "text" },
  { id: "phone", label: "Teléfono", type: "text" }
];

const LeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  consent: z.boolean().refine((v) => v === true)
});

function calculateLeadProfile(answers: Record<string, string>) {
  let score = 0;

  const concernScores: Record<string, number> = {
    "Arrugas o líneas de expresión": 3,
    "Flacidez y pérdida de firmeza": 3,
    "Manchas, hiperpigmentación o melasma": 2,
    "Grasa localizada": 2,
    "Ojeras y aspecto cansado": 2,
    "Acné, cicatrices o marcas": 1,
    "Retención de líquidos o inflamación": 1,
    "Cansancio, estrés o falta de energía": 1,
    "Poros abiertos o textura irregular de la piel": 1
  };

  const preferenceScores: Record<string, number> = {
    "Inyectables estéticos (Botox, toxina botulínica, ácido hialurónico, bioestimuladores)": 4,
    "Tecnología avanzada (HIFU, láser, microagujas)": 3,
    "Tratamientos no invasivos (faciales, radiofrecuencia, LED, hidrofacial)": 2,
    "Enfoque holístico y detox (ozono, vitaminas, sauna)": 1,
    "Prefiero que el especialista me recomiende la mejor opción para mí": 1
  };

  const experienceScores: Record<string, number> = {
    "Sí, tratamientos estéticos avanzados": 3,
    "Sí, tratamientos estéticos básicos": 2,
    "No, sería mi primera vez": 1,
    "Prefiero opciones holísticas y no invasivas": 1
  };

  score += concernScores[answers.concern] || 0;
  score += preferenceScores[answers.preference] || 0;
  score += experienceScores[answers.experience] || 0;

  let lead_type = "Nurture";
  if (score >= 9) lead_type = "Elite";
  else if (score >= 6) lead_type = "High";
  else if (score >= 3) lead_type = "Standard";

  const intent = {
    botox: answers.preference?.includes("Botox") || false,
    advanced_treatment: answers.preference?.includes("Tecnología") || false,
    first_time: answers.experience === "No, sería mi primera vez"
  };

  return { lead_score: score, lead_type, intent };
}

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ path: string; summary: string[] } | null>(null);
  const [lead, setLead] = useState({ name: "", email: "", phone: "", consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submittingRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const current = QUESTIONS[step];
  const progress = useMemo(() => Math.round((step / QUESTIONS.length) * 100), [step]);

  function onSelect(value: string) {
    setAnswers((a) => ({ ...a, [current.id]: value }));
  }

  function onText(value: string) {
    setAnswers((a) => ({ ...a, [current.id]: value }));
    if (current.id === "name") setLead((l) => ({ ...l, name: value }));
    if (current.id === "email") setLead((l) => ({ ...l, email: value }));
    if (current.id === "phone") setLead((l) => ({ ...l, phone: value }));
  }

  useEffect(() => {
    const el = wrapRef.current;
    const h = el
      ? Math.ceil(el.getBoundingClientRect().height)
      : document.documentElement.scrollHeight || document.body.scrollHeight;
    try {
      window.parent.postMessage({ type: "QUIZ_HEIGHT", height: h }, "*");
    } catch {}
  }, [step, result, done]);

  async function next() {
    if (!answers[current.id]) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    const profile = calculateLeadProfile(answers);

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, ...profile })
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function submitLead() {
    if (submittingRef.current || done) return;
    const parse = LeadSchema.safeParse(lead);
    if (!parse.success) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const profile = calculateLeadProfile(answers);
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result, lead, ...profile })
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  function resultTitle(path?: string) {
    if (!path) return "Recomendación personalizada";
    const p = String(path).toLowerCase();
    if (p.includes("rejuven") || p.includes("anti") || p.includes("advanced")) return "Recomendación: Rejuvenecimiento facial avanzado";
    if (p.includes("facial") || p.includes("skin")) return "Recomendación: Salud de piel y faciales";
    if (p.includes("lab") || p.includes("armon") || p.includes("lips")) return "Recomendación: Labios y armonización facial";
    if (p.includes("corp") || p.includes("body") || p.includes("remodel")) return "Recomendación: Remodelación corporal";
    if (p.includes("detox") || p.includes("well") || p.includes("ozono")) return "Recomendación: Detox y bienestar integral";
    if (p.includes("peso") || p.includes("weight") || p.includes("metab")) return "Recomendación: Control de peso y metabolismo";
    if (p.includes("eval") || p.includes("pro")) return "Recomendación: Evaluación profesional personalizada";
    return "Recomendación personalizada";
  }

  if (result) {
    return (
      <div ref={wrapRef} className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl shadow-xl ring-1 ring-black/5 overflow-hidden bg-white">
          <div className="px-6 py-6 border-b bg-[#fff5f1]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#a27c69]">Resultado</div>
              <div className="h-16 w-16 ring-2 ring-[#c2a091] bg-white rounded-full relative overflow-hidden flex items-center justify-center">
                <Image src="/blum-logo.png" alt="Blum Spa" fill className="object-contain scale-[1.35]" />
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-semibold text-[#6e4f42]">{resultTitle(result.path)}</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Basado en tus respuestas. En Blum Spa te orientamos de forma profesional, segura y personalizada.
            </p>
          </div>

          <div className="px-6 py-6 space-y-4">
            {Array.isArray(result.summary) && result.summary.length > 0 ? (
              <ul className="space-y-2">
                {result.summary.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[#3f2d26]">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border p-5 bg-[#fffafa] text-[#3f2d26]">
                <div className="font-medium text-[#6e4f42]">Recomendación inicial</div>
                <div className="mt-2 text-sm text-neutral-700">
                  Para definir el tratamiento ideal, te recomendamos una evaluación personalizada. Completa tus datos para
                  coordinar orientación.
                </div>
              </div>
            )}

            {!done ? (
              <div className="mt-6 rounded-2xl border p-6 space-y-4 bg-[#fffafa]">
                <h2 className="text-lg font-medium text-[#6e4f42]">Recibe tu orientación personalizada</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="rounded-xl border px-4 py-3"
                    placeholder="Nombre completo"
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  />
                  <input
                    className="rounded-xl border px-4 py-3"
                    placeholder="Correo electrónico"
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  />
                  <input
                    className="rounded-xl border px-4 py-3 md:col-span-2"
                    placeholder="Teléfono"
                    value={lead.phone}
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-[#3f2d26]">
                  <input
                    type="checkbox"
                    checked={lead.consent}
                    onChange={(e) => setLead({ ...lead, consent: e.target.checked })}
                  />
                  <span>Acepto ser contactada(o) por Blum Spa para orientación personalizada.</span>
                </label>
                <button
                  disabled={submitting}
                  onClick={submitLead}
                  className={`w-full rounded-xl px-6 py-4 text-white ${
                    submitting ? "bg-[#c2a091]/60 cursor-not-allowed" : "bg-[#c2a091]"
                  }`}
                >
                  {submitting ? "Enviando..." : "Enviar mi solicitud"}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border p-8 text-center bg-[#f7fff9]">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
                  <span className="text-xl">✅</span>
                </div>
                <div className="text-lg font-medium text-[#6e4f42]">¡Gracias!</div>
                <div className="mt-1 text-sm text-neutral-600">
                  Recibimos tu solicitud. Nuestro equipo se comunicará contigo pronto.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-3xl">
      <div className="rounded-3xl shadow-xl ring-1 ring-black/5 overflow-hidden bg-white">
        <div className="relative p-6 border-b bg-[#fff5f1]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#a27c69]">
              Pregunta {step + 1} de {QUESTIONS.length}
            </div>
            <div className="h-14 w-14 ring-2 ring-[#c2a091] bg-white rounded-full relative overflow-hidden">
              <Image src="/blum-logo-big.png" alt="Blum Spa" fill className="object-contain p-2" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${
                  i <= step ? "bg-[#c2a091] text-white" : "bg-[#eee3dc] text-[#7c5f52]"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 -bottom-[1px] h-1 bg-[#c2a091]" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6 md:p-10">
          <div className="min-h-[520px] flex flex-col">
            <h1 className="text-3xl md:text-4xl font-semibold text-center text-[#6e4f42]">{current.label}</h1>

            {current.type === "choice" && (
              <div className="mt-8 grid gap-4">
                {current.options!.map((opt) => {
                  const active = answers[current.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => onSelect(opt)}
                      className={`rounded-full px-6 py-4 border-2 text-lg transition text-[#3f2d26] ${
                        active ? "border-[#c2a091] bg-[#c2a091]/10" : "border-[#d6c4ba] hover:border-[#b39686]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "text" && (
              <div className="mt-8">
                <input
                  className="w-full rounded-xl border px-4 py-3 text-lg"
                  placeholder="Escribe aquí..."
                  value={answers[current.id] || ""}
                  onChange={(e) => onText(e.target.value)}
                />
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <button onClick={back} className="rounded-xl border px-5 py-3 text-[#3f2d26]">
                Atrás
              </button>
              <button
                onClick={next}
                disabled={!answers[current.id] || submitting}
                className={`rounded-xl px-6 py-3 text-white ${
                  !answers[current.id] || submitting ? "bg-[#c2a091]/60 cursor-not-allowed" : "bg-[#c2a091]"
                }`}
              >
                {step === QUESTIONS.length - 1 ? "Ver resultados" : "Continuar"}
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-[#6e4f42]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#efe2dc]">✨</span>
              <span>Recibirás una recomendación basada en tus respuestas.</span>
            </div>

            <div className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

