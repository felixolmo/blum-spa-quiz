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
      "Mejorar la apariencia de mi rostro (labios, pómulos, ojeras)",
      "Bajar de peso o desintoxicar mi cuerpo",
      "Faciales y limpieza profunda",
      "Remodelación corporal o tonificación",
      "Bienestar hormonal y salud integral",
      "No estoy segura(o), quiero orientación profesional"
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
      "Cuello / papada",
      "Cuerpo",
      "Peso y metabolismo",
      "Bienestar general"
    ]
  },
  {
    id: "concern",
    label: "¿Qué preocupación te identifica más en este momento?",
    type: "choice",
    options: [
      "Arrugas o líneas de expresión",
      "Manchas o melasma",
      "Flacidez",
      "Poros abiertos o textura irregular",
      "Ojeras",
      "Acné o marcas",
      "Grasa localizada",
      "Retención de líquidos",
      "Cansancio, inflamación o estrés"
    ]
  },
  {
    id: "experience",
    label: "¿Has recibido tratamientos estéticos antes?",
    type: "choice",
    options: [
      "Sí, tratamientos avanzados",
      "Sí, tratamientos básicos",
      "No, sería mi primera vez",
      "Prefiero opciones holísticas y no invasivas"
    ]
  },
  {
    id: "preference",
    label: "¿Qué tipo de tratamiento prefieres?",
    type: "choice",
    options: [
      "No invasivos (faciales, radiofrecuencia, LED, hidrofacial)",
      "Inyectables (toxina, ácido hialurónico, bioestimuladores)",
      "Tecnología avanzada (HIFU, láser, microagujas)",
      "Holístico y detox (ozono, vitaminas, sauna)",
      "Quiero que el especialista me recomiende"
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
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
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result, lead })
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
              <div className="h-14 w-14 ring-2 ring-[#c2a091] bg-white rounded-full relative overflow-hidden">
                <Image src="/blum-logo.png" alt="Blum Spa" fill className="object-contain p-2" />
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
              <Image src="/blum-logo.png" alt="Blum Spa" fill className="object-contain p-2" />
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
