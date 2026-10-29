"use client";

import { useState, type ReactNode } from "react";

import {
  buildInterestTable,
  compoundInterestBalance,
  simpleInterestBalance,
} from "@/lib/interest-calculations";
import type { LearningLab as LearningLabSpec } from "@/lib/learning-lab-schema";
import { transitionLabStage, type LabStage } from "@/lib/learning-lab-state";
import {
  compareMoonPrediction,
  getIlluminatedDiscPath,
  getMoonPhaseKey,
  getMoonPredictionPhaseKeys,
  getOrbitPosition,
  illuminatedFraction,
  type MoonPhaseKey,
} from "@/lib/moon-phases";
import type { SupportedLanguage } from "@/lib/diagnostic-schema";

type Copy = {
  predict: string;
  reveal: string;
  explore: string;
  observe: string;
  explanation: string;
  local: string;
  sunlight: string;
  earth: string;
  moon: string;
  angle: string;
  illuminated: string;
  shadowNote: string;
  predictionAtAngle: string;
  yourPrediction: string;
  observedPhase: string;
  correctFeedback: string;
  incorrectFeedback: string;
  scientificNote: string;
  scientificNoteText: string;
  principal: string;
  rate: string;
  years: string;
  simple: string;
  compound: string;
  difference: string;
  year: string;
  sideBySide: string;
};

const COPY: Record<SupportedLanguage, Copy> = {
  English: {
    predict: "Make a prediction",
    reveal: "Reveal and explore",
    explore: "Interactive exploration",
    observe: "What to observe",
    explanation: "What the model shows",
    local: "Changes here run locally — no additional AI request",
    sunlight: "Sunlight",
    earth: "Earth",
    moon: "Moon",
    angle: "Moon orbit angle",
    illuminated: "Visible illuminated fraction",
    shadowNote: "Ordinary Moon phases are not Earth’s shadow. They are the changing view of the Moon’s always sunlit half.",
    predictionAtAngle: "At an orbit angle of {angle}°, which Moon phase do you expect to observe?",
    yourPrediction: "Your prediction",
    observedPhase: "Observed phase",
    correctFeedback: "Nice reasoning — your prediction matches the model.",
    incorrectFeedback: "Good prediction. The observation is different, so compare the Moon’s position with the sunlit view and try the slider.",
    scientificNote: "Scientific note",
    scientificNoteText: "This simulation is a simplified top-down model. The Moon’s real orbit is inclined, so a Full Moon does not necessarily cause a lunar eclipse.",
    principal: "Starting amount",
    rate: "Annual rate",
    years: "Years",
    simple: "Simple interest",
    compound: "Compound interest",
    difference: "Compound advantage",
    year: "Year",
    sideBySide: "Side by side",
  },
  Hindi: {
    predict: "पहले अनुमान लगाएँ",
    reveal: "उत्तर खोलें और खोजें",
    explore: "इंटरैक्टिव खोज",
    observe: "क्या देखें",
    explanation: "मॉडल क्या दिखाता है",
    local: "यहाँ के बदलाव स्थानीय हैं — कोई अतिरिक्त AI अनुरोध नहीं",
    sunlight: "सूर्य का प्रकाश",
    earth: "पृथ्वी",
    moon: "चंद्रमा",
    angle: "चंद्रमा का कक्षीय कोण",
    illuminated: "दिखाई देने वाला प्रकाशित भाग",
    shadowNote: "सामान्य चंद्र कलाएँ पृथ्वी की छाया से नहीं बनतीं। वे चंद्रमा के सूर्य-प्रकाशित आधे भाग के बदलते दृश्य हैं।",
    predictionAtAngle: "{angle}° के कक्षीय कोण पर आपको चंद्रमा की कौन-सी कला दिखने की उम्मीद है?",
    yourPrediction: "आपका अनुमान",
    observedPhase: "देखी गई कला",
    correctFeedback: "बहुत अच्छा तर्क — आपका अनुमान मॉडल से मेल खाता है।",
    incorrectFeedback: "अच्छा अनुमान। अवलोकन अलग है; चंद्रमा की स्थिति की सूर्य-प्रकाशित दृश्य से तुलना करें और स्लाइडर आज़माएँ।",
    scientificNote: "वैज्ञानिक टिप्पणी",
    scientificNoteText: "यह सिमुलेशन ऊपर से देखा गया एक सरल मॉडल है। चंद्रमा की वास्तविक कक्षा झुकी हुई है, इसलिए पूर्णिमा से हर बार चंद्र ग्रहण नहीं होता।",
    principal: "आरंभिक राशि",
    rate: "वार्षिक दर",
    years: "वर्ष",
    simple: "साधारण ब्याज",
    compound: "चक्रवृद्धि ब्याज",
    difference: "चक्रवृद्धि लाभ",
    year: "वर्ष",
    sideBySide: "साथ-साथ",
  },
  Gujarati: {
    predict: "પહેલા અનુમાન કરો",
    reveal: "જવાબ ખોલો અને શોધો",
    explore: "ઇન્ટરેક્ટિવ શોધ",
    observe: "શું જોવું",
    explanation: "મોડેલ શું બતાવે છે",
    local: "અહીંના ફેરફાર સ્થાનિક છે — કોઈ વધારાની AI વિનંતી નહીં",
    sunlight: "સૂર્યપ્રકાશ",
    earth: "પૃથ્વી",
    moon: "ચંદ્ર",
    angle: "ચંદ્રનો કક્ષીય ખૂણો",
    illuminated: "દેખાતો પ્રકાશિત ભાગ",
    shadowNote: "સામાન્ય ચંદ્રકળાઓ પૃથ્વીની છાયાથી બનતી નથી. તે ચંદ્રના હંમેશાં સૂર્યપ્રકાશિત અડધા ભાગનું બદલાતું દૃશ્ય છે.",
    predictionAtAngle: "{angle}°ના કક્ષીય ખૂણે તમને ચંદ્રની કઈ કળા જોવા મળશે એવું લાગે છે?",
    yourPrediction: "તમારી આગાહી",
    observedPhase: "જોયેલી કળા",
    correctFeedback: "સરસ તર્ક — તમારી આગાહી મોડેલ સાથે મેળ ખાય છે.",
    incorrectFeedback: "સારી આગાહી. અવલોકન અલગ છે; ચંદ્રની સ્થિતિની સૂર્યપ્રકાશિત દૃશ્ય સાથે તુલના કરો અને સ્લાઇડર અજમાવો.",
    scientificNote: "વૈજ્ઞાનિક નોંધ",
    scientificNoteText: "આ સિમ્યુલેશન ઉપરથી જોવામાં આવતું સરળ મોડેલ છે. ચંદ્રની વાસ્તવિક કક્ષા ઢળેલી છે, તેથી પૂર્ણિમાએ હંમેશાં ચંદ્રગ્રહણ થતું નથી.",
    principal: "શરૂઆતની રકમ",
    rate: "વાર્ષિક દર",
    years: "વર્ષ",
    simple: "સાદું વ્યાજ",
    compound: "ચક્રવૃદ્ધિ વ્યાજ",
    difference: "ચક્રવૃદ્ધિ લાભ",
    year: "વર્ષ",
    sideBySide: "સાથે-સાથે",
  },
};

const PHASE_NAMES: Record<SupportedLanguage, Record<MoonPhaseKey, string>> = {
  English: {
    new_moon: "New moon",
    waxing_crescent: "Waxing crescent",
    first_quarter: "First quarter",
    waxing_gibbous: "Waxing gibbous",
    full_moon: "Full moon",
    waning_gibbous: "Waning gibbous",
    third_quarter: "Third quarter",
    waning_crescent: "Waning crescent",
  },
  Hindi: {
    new_moon: "अमावस्या",
    waxing_crescent: "बढ़ता अर्धचंद्र",
    first_quarter: "प्रथम चतुर्थांश",
    waxing_gibbous: "बढ़ता गिबस",
    full_moon: "पूर्णिमा",
    waning_gibbous: "घटता गिबस",
    third_quarter: "तृतीय चतुर्थांश",
    waning_crescent: "घटता अर्धचंद्र",
  },
  Gujarati: {
    new_moon: "અમાસ",
    waxing_crescent: "વધતી ચંદ્રકળા",
    first_quarter: "પ્રથમ ચતુર્થાંશ",
    waxing_gibbous: "વધતો ગિબસ",
    full_moon: "પૂનમ",
    waning_gibbous: "ઘટતો ગિબસ",
    third_quarter: "તૃતીય ચતુર્થાંશ",
    waning_crescent: "ઘટતી ચંદ્રકળા",
  },
};

type PredictionOption = { id: string; text: string };

function PredictionGate({
  question,
  options,
  stage,
  selection,
  language,
  onSelection,
  onReveal,
}: {
  question: string;
  options: PredictionOption[];
  stage: LabStage;
  selection: string;
  language: SupportedLanguage;
  onSelection: (id: string) => void;
  onReveal: () => void;
}) {
  const copy = COPY[language];

  if (stage === "exploration") {
    const selected = options.find((option) => option.id === selection);
    return (
      <div className="rounded-2xl border border-[#cddac5] bg-[#f1f5e7] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7e58]">{copy.predict}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#40553a]">{selected?.text}</p>
      </div>
    );
  }

  return (
    <fieldset className="rounded-3xl border border-[#dce3db] bg-white p-5 sm:p-6">
      <legend className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7c72]">
        {copy.predict}
      </legend>
      <p className="text-lg font-semibold leading-7 tracking-[-0.02em] text-[#234438]">{question}</p>
      <div className="mt-4 space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-6 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#315e4f] ${
              selection === option.id
                ? "border-[#315e4f] bg-[#edf4ef] text-[#26483c]"
                : "border-[#e0e5df] bg-[#fafbf8] text-[#5f6e66] hover:border-[#adbbb1]"
            }`}
          >
            <input
              type="radio"
              name="lab-prediction"
              value={option.id}
              checked={selection === option.id}
              onChange={() => onSelection(option.id)}
              className="mt-1 h-4 w-4 accent-[#315e4f]"
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={!selection}
        onClick={onReveal}
        className="mt-5 min-h-11 w-full rounded-2xl bg-[#173f34] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#224f42] disabled:cursor-not-allowed disabled:bg-[#b8c1bb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e4f]"
      >
        {copy.reveal}
      </button>
    </fieldset>
  );
}

function LabFrame({
  lab,
  children,
  showInstructions = true,
}: {
  lab: LearningLabSpec;
  children: ReactNode;
  showInstructions?: boolean;
}) {
  const copy = COPY[lab.selectedLanguage];
  return (
    <div className="animate-fade-up border-t border-[#dde4dd] bg-[#f7f8f3] px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#668073]">Learning Lab · Milestone 04</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#173d32]">{lab.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#66756d]">{lab.learningObjective}</p>
        </div>
        <span className="rounded-full border border-[#ced9d1] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#587065]">
          {lab.labType.replaceAll("_", " ")}
        </span>
      </div>
      {showInstructions && (
        <div className="mt-5 rounded-2xl bg-[#eaf0db] px-4 py-3 text-sm leading-6 text-[#4c6044]">{lab.shortInstructions}</div>
      )}
      <div className="mt-6">{children}</div>
      <p className="mt-4 text-center text-[11px] font-medium text-[#819087]">{copy.local}</p>
    </div>
  );
}

function RevealNotes({ lab }: { lab: LearningLabSpec }) {
  const copy = COPY[lab.selectedLanguage];
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#dce3dd] bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718078]">{copy.observe}</p>
        <ul className="mt-3 space-y-2">
          {lab.observationPrompts.map((prompt, index) => (
            <li key={`${prompt}-${index}`} className="flex gap-3 text-sm leading-6 text-[#596a61]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#789366]" />
              {prompt}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-[#d7dfc8] bg-[#f4f6e9] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7e58]">{copy.explanation}</p>
        <p className="mt-3 text-sm leading-6 text-[#53604a]">{lab.explanation}</p>
      </section>
    </div>
  );
}

function MoonPhasesLab({ lab }: { lab: Extract<LearningLabSpec, { labType: "moon_phases" }> }) {
  const [stage, setStage] = useState<LabStage>("prediction");
  const [prediction, setPrediction] = useState("");
  const [angle, setAngle] = useState(lab.initialConfiguration.initialOrbitAngle);
  const copy = COPY[lab.selectedLanguage];
  const phaseKey = getMoonPhaseKey(angle);
  const fraction = illuminatedFraction(angle);
  const moon = getOrbitPosition(angle, 190, 155, 104);
  const predictionAngle = lab.initialConfiguration.initialOrbitAngle;
  const predictionOptions = getMoonPredictionPhaseKeys(predictionAngle).map((key) => ({
    id: key,
    text: PHASE_NAMES[lab.selectedLanguage][key],
  }));
  const predictionResult = prediction
    ? compareMoonPrediction(prediction as MoonPhaseKey, predictionAngle)
    : null;

  return (
    <LabFrame lab={lab} showInstructions={stage === "exploration"}>
      <PredictionGate
        question={copy.predictionAtAngle.replace("{angle}", String(Math.round(predictionAngle)))}
        options={predictionOptions}
        stage={stage}
        selection={prediction}
        language={lab.selectedLanguage}
        onSelection={setPrediction}
        onReveal={() => setStage(transitionLabStage(stage, "reveal", Boolean(prediction)))}
      />
      {stage === "exploration" && (
        <div className="mt-5">
          {predictionResult && (
            <section
              aria-live="polite"
              className={`mb-5 rounded-2xl border p-5 ${
                predictionResult.isCorrect
                  ? "border-[#c9dac0] bg-[#f0f6e9]"
                  : "border-[#dfd5b8] bg-[#fff9e9]"
              }`}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">{copy.yourPrediction}</p>
                  <p className="mt-1 text-sm font-semibold text-[#304c41]">{PHASE_NAMES[lab.selectedLanguage][predictionResult.predicted]}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">{copy.observedPhase}</p>
                  <p className="mt-1 text-sm font-semibold text-[#304c41]">{PHASE_NAMES[lab.selectedLanguage][predictionResult.observed]}</p>
                </div>
              </div>
              <p className="mt-3 border-t border-current/10 pt-3 text-sm leading-6 text-[#53604a]">
                {predictionResult.isCorrect ? copy.correctFeedback : copy.incorrectFeedback}
              </p>
            </section>
          )}
          <section className="grid gap-5 rounded-3xl bg-[#102f29] p-4 text-white sm:p-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9da8d]">{copy.explore}</p>
              <svg
                viewBox="0 0 430 310"
                role="img"
                aria-label={`${PHASE_NAMES[lab.selectedLanguage][phaseKey]}, ${Math.round(fraction * 100)}% ${copy.illuminated}`}
                className="mt-3 w-full rounded-2xl bg-[#0b2521]"
              >
                <defs>
                  <marker id="sun-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0 0L8 4L0 8Z" fill="#f2d66d" />
                  </marker>
                  <radialGradient id="earth-fill" cx="35%" cy="30%">
                    <stop offset="0" stopColor="#76a9a0" />
                    <stop offset="1" stopColor="#285c55" />
                  </radialGradient>
                </defs>
                <text x="365" y="28" fill="#f7dda0" fontSize="11">{copy.sunlight}</text>
                {[65, 105, 145, 185, 225].map((y) => (
                  <line key={y} x1="415" y1={y} x2="330" y2={y} stroke="#f2d66d" strokeWidth="2" opacity="0.8" markerEnd="url(#sun-arrow)" />
                ))}
                <circle cx="190" cy="155" r="104" fill="none" stroke="#66857a" strokeDasharray="5 7" opacity="0.55" />
                <circle cx="190" cy="155" r="30" fill="url(#earth-fill)" />
                <path d="M175 143c8-10 14-7 21-14 4 9 14 8 18 18-7 7-3 18-15 23-8-8-17-6-24-14Z" fill="#9cba6d" opacity="0.8" />
                <text x="190" y="200" textAnchor="middle" fill="#afc4bc" fontSize="11">{copy.earth}</text>
                <g transform={`translate(${moon.x} ${moon.y})`}>
                  <circle r="15" fill="#273833" stroke="#dce5df" strokeWidth="1" />
                  <path d="M0-15A15 15 0 0 1 0 15V-15Z" fill="#f4edce" />
                </g>
              </svg>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-5">
              <svg viewBox="-55 -55 110 110" aria-hidden="true" className="mx-auto h-32 w-32 rounded-full bg-[#0a201c]">
                <circle r="48" fill="#283934" stroke="#607970" strokeWidth="2" />
                <path d={getIlluminatedDiscPath(angle)} fill="#f5efcf" />
              </svg>
              <p className="mt-4 text-center text-xl font-semibold">{PHASE_NAMES[lab.selectedLanguage][phaseKey]}</p>
              <p className="mt-1 text-center text-sm text-[#c9d6d0]">{copy.illuminated}: {Math.round(fraction * 100)}%</p>
            </div>
          </section>
          <div className="mt-5 rounded-2xl border border-[#dce3dd] bg-white p-5">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#315447]">
              <label htmlFor="moon-angle">{copy.angle}</label>
              <output htmlFor="moon-angle">{Math.round(angle)}°</output>
            </div>
            <input
              id="moon-angle"
              type="range"
              min="0"
              max="360"
              step="1"
              value={angle}
              onChange={(event) => setAngle(Number(event.target.value))}
              className="mt-4 w-full accent-[#315e4f]"
            />
            <div className="mt-2 flex justify-between text-[10px] text-[#7b8881]" aria-hidden="true">
              <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
            </div>
          </div>
          <p className="mt-5 rounded-2xl border border-[#e2d8bd] bg-[#fff9e9] p-4 text-sm leading-6 text-[#6b5c3f]">{copy.shadowNote}</p>
          <aside className="mt-4 rounded-2xl border border-[#d8e0dc] bg-[#f5f7f4] p-4 text-sm leading-6 text-[#586860]">
            <span className="font-bold text-[#315447]">{copy.scientificNote}: </span>
            {copy.scientificNoteText}
          </aside>
          <RevealNotes lab={lab} />
        </div>
      )}
    </LabFrame>
  );
}

function CompoundInterestLab({ lab }: { lab: Extract<LearningLabSpec, { labType: "compound_interest" }> }) {
  const [stage, setStage] = useState<LabStage>("prediction");
  const [prediction, setPrediction] = useState("");
  const [principal, setPrincipal] = useState(lab.initialConfiguration.principal);
  const [rate, setRate] = useState(lab.initialConfiguration.annualRatePercent);
  const [years, setYears] = useState(lab.initialConfiguration.years);
  const copy = COPY[lab.selectedLanguage];
  const table = buildInterestTable(principal, rate, years);
  const simple = simpleInterestBalance(principal, rate, years);
  const compound = compoundInterestBalance(principal, rate, years);
  const currency = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

  return (
    <LabFrame lab={lab}>
      <PredictionGate
        question={lab.predictionQuestion}
        options={lab.initialConfiguration.predictionOptions}
        stage={stage}
        selection={prediction}
        language={lab.selectedLanguage}
        onSelection={setPrediction}
        onReveal={() => setStage(transitionLabStage(stage, "reveal", Boolean(prediction)))}
      />
      {stage === "exploration" && (
        <div className="mt-5">
          <section className="rounded-3xl border border-[#dce3dd] bg-white p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#668073]">{copy.explore}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <NumberField label={copy.principal} value={principal} min={100} max={1_000_000} step={100} onChange={setPrincipal} />
              <NumberField label={`${copy.rate} (%)`} value={rate} min={0.1} max={50} step={0.1} onChange={setRate} />
              <NumberField label={copy.years} value={years} min={1} max={50} step={1} onChange={(value) => setYears(Math.round(value))} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label={copy.simple} value={currency.format(simple)} />
              <Metric label={copy.compound} value={currency.format(compound)} highlight />
              <Metric label={copy.difference} value={currency.format(compound - simple)} />
            </div>
            <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-[#e0e5df]">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[#eef3e7] text-[#40584d]">
                  <tr><th className="p-3">{copy.year}</th><th className="p-3">{copy.simple}</th><th className="p-3">{copy.compound}</th><th className="p-3">{copy.difference}</th></tr>
                </thead>
                <tbody>
                  {table.map((row) => (
                    <tr key={row.year} className="border-t border-[#e7ebe6] text-[#5e6e66]">
                      <td className="p-3 font-semibold">{row.year}</td>
                      <td className="p-3">{currency.format(row.simpleBalance)}</td>
                      <td className="p-3">{currency.format(row.compoundBalance)}</td>
                      <td className="p-3">{currency.format(row.difference)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <RevealNotes lab={lab} />
        </div>
      )}
    </LabFrame>
  );
}

function NumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-bold text-[#53675d]">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
        }}
        className="mt-2 w-full rounded-xl border border-[#dce3dd] bg-[#fafbf8] px-3 py-3 text-sm font-semibold text-[#29483d] outline-none focus:border-[#6d897a] focus:ring-4 focus:ring-[#9db5a6]/15"
      />
    </label>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-[#173f34] text-white" : "bg-[#f2f5ee] text-[#29483d]"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${highlight ? "text-[#cbdc8e]" : "text-[#748179]"}`}>{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ConceptComparisonLab({ lab }: { lab: Extract<LearningLabSpec, { labType: "concept_comparison" }> }) {
  const [stage, setStage] = useState<LabStage>("prediction");
  const [prediction, setPrediction] = useState("");
  const [view, setView] = useState<"a" | "both" | "b">("both");
  const copy = COPY[lab.selectedLanguage];
  const config = lab.initialConfiguration;

  return (
    <LabFrame lab={lab}>
      <PredictionGate
        question={lab.predictionQuestion}
        options={config.predictionOptions}
        stage={stage}
        selection={prediction}
        language={lab.selectedLanguage}
        onSelection={setPrediction}
        onReveal={() => setStage(transitionLabStage(stage, "reveal", Boolean(prediction)))}
      />
      {stage === "exploration" && (
        <div className="mt-5">
          <section className="rounded-3xl border border-[#dce3dd] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#668073]">{copy.explore}</p><p className="mt-1 text-sm font-semibold text-[#315447]">{config.comparisonDimension}</p></div>
              <div className="flex rounded-xl bg-[#eef2ea] p-1" aria-label="Comparison view">
                {(["a", "both", "b"] as const).map((option) => (
                  <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e4f] ${view === option ? "bg-white text-[#315447] shadow-sm" : "text-[#77847d]"}`}>
                    {option === "both" ? copy.sideBySide : option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className={`mt-5 grid gap-4 ${view === "both" ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {view !== "b" && <ScenarioCard marker="A" scenario={config.scenarioA} />}
              {view !== "a" && <ScenarioCard marker="B" scenario={config.scenarioB} accent />}
            </div>
          </section>
          <RevealNotes lab={lab} />
        </div>
      )}
    </LabFrame>
  );
}

function ScenarioCard({ marker, scenario, accent = false }: { marker: string; scenario: { title: string; setup: string; keyObservations: string[] }; accent?: boolean }) {
  return (
    <article className={`rounded-2xl border p-5 ${accent ? "border-[#cad9c1] bg-[#f1f5e8]" : "border-[#e2dfd5] bg-[#fbfaf6]"}`}>
      <div className="flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${accent ? "bg-[#637f57] text-white" : "bg-[#927b61] text-white"}`}>{marker}</span><h3 className="font-semibold text-[#29483d]">{scenario.title}</h3></div>
      <p className="mt-4 text-sm leading-6 text-[#637068]">{scenario.setup}</p>
      <ul className="mt-4 space-y-2 border-t border-[#dde3da] pt-4">
        {scenario.keyObservations.map((observation, index) => <li key={`${observation}-${index}`} className="flex gap-3 text-sm leading-6 text-[#52635a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#789366]" />{observation}</li>)}
      </ul>
    </article>
  );
}

export function LearningLab({ lab }: { lab: LearningLabSpec }) {
  if (lab.labType === "moon_phases") return <MoonPhasesLab lab={lab} />;
  if (lab.labType === "compound_interest") return <CompoundInterestLab lab={lab} />;
  return <ConceptComparisonLab lab={lab} />;
}

