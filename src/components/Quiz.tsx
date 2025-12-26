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
  const [leadProfile, setLeadProfile] = useState<any>(null);
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

  async function next() {
    if (!answers[current.id]) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    const profile = calculateLeadProfile(answers);
    setLeadProfile(profile);

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
        body: JSON.stringify({ answers, result, lead, ...leadProfile })
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return <div>READY FOR DEPLOY</div>;
}

