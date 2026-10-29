"use client";

import { type FormEvent, useState } from "react";

import { LearningLab } from "@/app/components/learning-lab";

import {
  canSubmitEvaluation,
  cleanInterpretationPrefix,
  getJourneyStep,
} from "@/lib/assessment-journey";
import {
  diagnoseErrorSchema,
  diagnoseSuccessSchema,
  evaluateSuccessSchema,
  SUPPORTED_LANGUAGES,
  type AdaptiveAssessment,
  type DiagnosticPlan,
  type SupportedLanguage,
} from "@/lib/diagnostic-schema";
import {
  labSuccessSchema,
  type LearningLab as LearningLabSpec,
} from "@/lib/learning-lab-schema";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  English: "English",
  Hindi: "हिन्दी",
  Gujarati: "ગુજરાતી",
};

const LEVEL_DETAILS: Record<
  AdaptiveAssessment["understandingLevel"],
  { label: string; className: string }
> = {
  strong: {
    label: "Strong understanding",
    className: "bg-[#dfecc5] text-[#31513e] border-[#c5d9a3]",
  },
  partial: {
    label: "Partial understanding",
    className: "bg-[#f5e9bd] text-[#6e5721] border-[#e7d58d]",
  },
  needs_foundation: {
    label: "Foundation needed",
    className: "bg-[#f5ded1] text-[#854a35] border-[#e7c2b0]",
  },
  uncertain: {
    label: "More evidence needed",
    className: "bg-[#e8e9e4] text-[#56625b] border-[#d5d9d3]",
  },
};

const ACTION_LABELS: Record<AdaptiveAssessment["recommendedNextAction"], string> = {
  advance: "Ready to advance",
  reteach: "Rebuild this foundation",
  clarify: "Clarify with one more check",
};

type AsyncState = "idle" | "loading" | "error" | "success";

function LogoMark() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 32 32" fill="none">
      <path
        d="M7 8.5C10.8 4.8 16.6 4.1 21.1 6.8C25.6 9.5 27.5 15 25.4 19.8C23.4 24.6 18.1 27.3 13.1 25.9C8 24.5 4.8 19.7 5.5 14.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M10 11.5C12.7 8.8 17 8.4 20.1 10.5C23.2 12.7 24.1 16.9 22 20C19.9 23.1 15.6 24 12.5 21.9C9.4 19.8 8.5 15.5 10.6 12.4L22.7 25"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 10h12m-4.5-4.5L16 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JourneySteps({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, label: "Learning goal" },
    { number: 2, label: "Diagnostic check" },
    { number: 3, label: "Adaptive decision" },
  ] as const;

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="MindLoom assessment progress">
      {steps.map((step) => {
        const isActive = step.number === currentStep;
        const isComplete = step.number < currentStep;

        return (
          <li
            key={step.number}
            aria-current={isActive ? "step" : undefined}
            className={`rounded-2xl border px-3 py-3 transition sm:px-4 ${
              isActive
                ? "border-[#315e4f] bg-[#315e4f] text-white shadow-sm"
                : isComplete
                  ? "border-[#cad6bd] bg-[#eef3dc] text-[#355347]"
                  : "border-[#dfe4dd] bg-white/60 text-[#87918b]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-white text-[#315e4f]"
                    : isComplete
                      ? "bg-[#789366] text-white"
                      : "bg-[#edf0eb] text-[#7d8781]"
                }`}
              >
                {isComplete ? "✓" : step.number}
              </span>
              <span className="hidden text-xs font-semibold sm:block">{step.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-8 h-36 w-36" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border border-dashed border-[#b9c6bd]" />
        <div className="absolute left-1/2 top-3 h-10 w-10 -translate-x-1/2 rounded-full border border-[#d9dfda] bg-white shadow-sm" />
        <div className="absolute bottom-5 left-2 h-9 w-9 rounded-full border border-[#d9dfda] bg-white shadow-sm" />
        <div className="absolute bottom-5 right-2 h-9 w-9 rounded-full border border-[#d9dfda] bg-white shadow-sm" />
        <svg className="absolute inset-0" viewBox="0 0 144 144" fill="none">
          <path d="M72 53v20L36 98m36-25 36 25" stroke="#7c9483" strokeWidth="1.5" />
        </svg>
        <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#153f33] text-[#e7f3a5] shadow-[0_10px_30px_rgba(21,63,51,0.22)]">
          <LogoMark />
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#728078]">
        Ready to map understanding
      </p>
      <h2 className="mt-3 max-w-sm text-2xl font-semibold tracking-[-0.03em] text-[#18342c]">
        Your first diagnostic check will appear here.
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#68746e]">
        MindLoom will ask one carefully chosen question before revealing any diagnostic interpretation.
      </p>
    </div>
  );
}

function LoadingPlan() {
  return (
    <div className="min-h-[480px] px-6 py-8 sm:px-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3 border-b border-[#e5e8e3] pb-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2cf]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-[#587060]" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#18342c]">Designing one revealing check</p>
          <p className="mt-0.5 text-xs text-[#7b857f]">Mapping the concept without giving it away…</p>
        </div>
      </div>
      <div className="mt-8 space-y-7">
        {["w-2/3", "w-full", "w-5/6"].map((width, index) => (
          <div key={width} className="space-y-3">
            <div className={`skeleton h-3 ${index === 0 ? "w-24" : "w-32"} rounded-full`} />
            <div className={`skeleton h-5 ${width} rounded-full`} />
            <div className="skeleton h-4 w-4/5 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Generating the diagnostic question.</span>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border border-[#edc9b8] bg-[#fff4ee] px-4 py-3 text-sm leading-6 text-[#864d38]"
      role="alert"
    >
      {message}
    </div>
  );
}

function GoalForm({
  question,
  language,
  requestState,
  errorMessage,
  onQuestionChange,
  onLanguageChange,
  onSubmit,
}: {
  question: string;
  language: SupportedLanguage;
  requestState: AsyncState;
  errorMessage: string;
  onQuestionChange: (question: string) => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const trimmedQuestion = question.trim();
  const canSubmit =
    trimmedQuestion.length >= 8 &&
    trimmedQuestion.length <= 2000 &&
    requestState !== "loading";

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">Step 01</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#193d32]">
            What are you trying to understand?
          </h2>
        </div>
        <span className="rounded-full bg-[#f1f3ec] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78847d]">
          Diagnose
        </span>
      </div>

      <label htmlFor="learner-question" className="sr-only">
        Your learning question
      </label>
      <textarea
        id="learner-question"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        maxLength={2000}
        rows={7}
        placeholder="For example: Why does increasing interest rates usually reduce inflation?"
        className="mt-6 w-full resize-none rounded-2xl border border-[#dfe4dd] bg-[#fafbf8] px-4 py-4 text-[15px] leading-7 text-[#203c33] outline-none transition placeholder:text-[#9ba39e] hover:border-[#c5d0c8] focus:border-[#6d897a] focus:bg-white focus:ring-4 focus:ring-[#9db5a6]/15"
        aria-describedby="question-help question-count"
      />
      <div className="mt-2 flex items-start justify-between gap-4 text-xs">
        <p id="question-help" className="max-w-[250px] leading-5 text-[#7a857f]">
          Include what feels confusing. Minimum 8 characters.
        </p>
        <p
          id="question-count"
          className={question.length > 1900 ? "font-semibold text-[#a6523b]" : "text-[#939b96]"}
        >
          {question.length}/2000
        </p>
      </div>

      <fieldset className="mt-7">
        <legend className="text-xs font-bold uppercase tracking-[0.16em] text-[#627269]">
          Response language
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SUPPORTED_LANGUAGES.map((option) => {
            const isSelected = language === option;

            return (
              <label
                key={option}
                className={`cursor-pointer rounded-xl border px-2 py-3 text-center text-sm font-semibold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#315e4f] ${
                  isSelected
                    ? "border-[#315e4f] bg-[#315e4f] text-white shadow-sm"
                    : "border-[#dfe4dd] bg-[#fafbf8] text-[#637169] hover:border-[#aab9af]"
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={option}
                  checked={isSelected}
                  onChange={() => onLanguageChange(option)}
                  className="sr-only"
                />
                {LANGUAGE_LABELS[option]}
              </label>
            );
          })}
        </div>
      </fieldset>

      {requestState === "error" && (
        <div className="mt-5">
          <InlineError message={errorMessage} />
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="group mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#173f34] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(23,63,52,0.18)] transition hover:bg-[#224f42] disabled:cursor-not-allowed disabled:bg-[#b8c1bb] disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e4f]"
      >
        {requestState === "loading" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Building your diagnostic
          </>
        ) : (
          <>
            Build my diagnostic check
            <span className="transition-transform group-hover:translate-x-0.5">
              <ArrowIcon />
            </span>
          </>
        )}
      </button>
    </form>
  );
}

function GoalSummary({
  goal,
  language,
  onStartOver,
}: {
  goal: string;
  language: SupportedLanguage;
  onStartOver: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">
          Step 01 · Complete
        </p>
        <button
          type="button"
          onClick={onStartOver}
          className="text-xs font-semibold text-[#60766b] underline decoration-[#aebbb4] underline-offset-4 hover:text-[#315e4f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e4f]"
        >
          Start over
        </button>
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[#193d32]">
        Learning goal
      </h2>
      <p className="mt-3 rounded-2xl bg-[#f3f5ef] p-4 text-sm leading-6 text-[#51645b]">{goal}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#7a857f]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#86a06d]" />
        Feedback in {LANGUAGE_LABELS[language]}
      </div>
    </div>
  );
}

function DiagnosticAssessment({
  plan,
  selectedOptionIndex,
  explanation,
  requestState,
  errorMessage,
  onSelectOption,
  onExplanationChange,
  onSubmit,
}: {
  plan: DiagnosticPlan;
  selectedOptionIndex: number | null;
  explanation: string;
  requestState: AsyncState;
  errorMessage: string;
  onSelectOption: (index: number) => void;
  onExplanationChange: (explanation: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const trimmedExplanation = explanation.trim();
  const canSubmit = canSubmitEvaluation(
    selectedOptionIndex,
    trimmedExplanation,
    requestState === "loading",
  );

  return (
    <form onSubmit={onSubmit} className="animate-fade-up px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#668073]">
            Step 02 · Diagnostic check
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#173d32]">
            Show how you are thinking
          </h2>
        </div>
        <span className="rounded-full border border-[#d6ded8] bg-white px-3 py-1.5 text-xs font-medium text-[#66756d]">
          No hints yet
        </span>
      </div>

      <fieldset className="mt-7">
        <legend className="w-full rounded-2xl bg-[#173f34] p-5 text-left text-lg font-semibold leading-7 tracking-[-0.02em] text-white shadow-[0_16px_38px_rgba(23,63,52,0.14)] sm:p-6">
          {plan.diagnosticQuestion.prompt}
        </legend>
        <div className="mt-4 space-y-3">
          {plan.diagnosticQuestion.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;

            return (
              <label
                key={`${option.label}-${index}`}
                className={`group flex cursor-pointer gap-4 rounded-2xl border p-4 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#315e4f] sm:p-5 ${
                  isSelected
                    ? "border-[#315e4f] bg-[#edf4ef] shadow-[0_8px_24px_rgba(49,94,79,0.1)]"
                    : "border-[#dfe4dd] bg-white hover:border-[#9caf9f] hover:bg-[#fbfcf9]"
                }`}
              >
                <input
                  type="radio"
                  name="diagnostic-answer"
                  value={index}
                  checked={isSelected}
                  onChange={() => onSelectOption(index)}
                  className="sr-only"
                />
                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#315e4f] text-white"
                      : "bg-[#eef1e9] text-[#65736b] group-hover:bg-[#e4eadf]"
                  }`}
                >
                  {option.label}
                </span>
                <span className="pt-1 text-sm font-semibold leading-6 text-[#29463c]">
                  {option.answer}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-7">
        <label htmlFor="learner-explanation" className="text-sm font-bold text-[#29483d]">
          Why did you choose that answer?
        </label>
        <p id="explanation-help" className="mt-1 text-xs leading-5 text-[#7a857f]">
          Describe your reasoning in your own words. This matters more than choosing the expected option.
        </p>
        <textarea
          id="learner-explanation"
          value={explanation}
          onChange={(event) => onExplanationChange(event.target.value)}
          minLength={20}
          maxLength={1000}
          rows={5}
          placeholder="I chose this because…"
          className="mt-3 w-full resize-none rounded-2xl border border-[#dfe4dd] bg-white px-4 py-4 text-sm leading-6 text-[#203c33] outline-none transition placeholder:text-[#9ba39e] hover:border-[#c5d0c8] focus:border-[#6d897a] focus:ring-4 focus:ring-[#9db5a6]/15"
          aria-describedby="explanation-help explanation-count"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={trimmedExplanation.length > 0 && trimmedExplanation.length < 20 ? "text-[#a6523b]" : "text-[#89928d]"}>
            Minimum 20 characters
          </span>
          <span id="explanation-count" className={explanation.length > 900 ? "font-semibold text-[#a6523b]" : "text-[#939b96]"}>
            {explanation.length}/1000
          </span>
        </div>
      </div>

      {requestState === "error" && (
        <div className="mt-5">
          <InlineError message={errorMessage} />
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="group mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#173f34] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(23,63,52,0.18)] transition hover:bg-[#224f42] disabled:cursor-not-allowed disabled:bg-[#b8c1bb] disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e4f]"
      >
        {requestState === "loading" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Assessing your reasoning
          </>
        ) : (
          <>
            Check my understanding
            <span className="transition-transform group-hover:translate-x-0.5">
              <ArrowIcon />
            </span>
          </>
        )}
      </button>
      {requestState === "loading" && (
        <p className="mt-3 text-center text-xs text-[#78847d]" role="status" aria-live="polite">
          Comparing your answer and explanation with the underlying concept…
        </p>
      )}
    </form>
  );
}

function AssessmentResult({
  plan,
  assessment,
  selectedOptionIndex,
  lab,
  labState,
  labError,
  onExplore,
}: {
  plan: DiagnosticPlan;
  assessment: AdaptiveAssessment;
  selectedOptionIndex: number;
  lab: LearningLabSpec | null;
  labState: AsyncState;
  labError: string;
  onExplore: () => void;
}) {
  const level = LEVEL_DETAILS[assessment.understandingLevel];
  const selectedOption = plan.diagnosticQuestion.options[selectedOptionIndex];
  const optionInterpretation = cleanInterpretationPrefix(
    selectedOption.possibleInterpretation,
  );
  const conceptAlignment =
    assessment.isAnswerConsistentWithConcept === null
      ? "Not enough evidence yet"
      : assessment.isAnswerConsistentWithConcept
        ? "Consistent with the concept"
        : "Not yet consistent with the concept";

  return (
    <div className="animate-fade-up px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#668073]">
            Step 03 · First adaptive decision
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#173d32]">
            Your current understanding map
          </h2>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${level.className}`}>
          {level.label}
        </span>
      </div>

      <section className="mt-7 rounded-3xl bg-[#173f34] p-6 text-white shadow-[0_18px_45px_rgba(23,63,52,0.16)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#cbdc8e]">
          Personalized feedback
        </p>
        <p className="mt-3 text-lg font-medium leading-8 tracking-[-0.015em]">
          {assessment.tailoredFeedback}
        </p>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#dce3dd] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718078]">
            Observed in your response
          </p>
          <ul className="mt-3 space-y-3">
            {assessment.observedEvidence.map((evidence, index) => (
              <li key={`${evidence}-${index}`} className="flex gap-3 text-sm leading-6 text-[#53645b]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#789366]" />
                {evidence}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-[#e7eae6] pt-3 text-xs font-semibold text-[#53685e]">
            Concept alignment: {conceptAlignment}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e7d9c8] bg-[#fffaf1] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#987556]">
            Possible knowledge gap
          </p>
          <p className="mt-3 text-sm leading-6 text-[#705d4d]">
            {assessment.possibleKnowledgeGap ??
              "There is not enough evidence to name a specific gap yet."}
          </p>
          <p className="mt-3 text-[11px] leading-5 text-[#998674]">
            This is a tentative inference from this response, not a fixed label.
          </p>
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-[#cbd9d1] bg-[#edf4ef] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#597367]">
            Adaptive micro-lesson
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4d6b5f]">
            {ACTION_LABELS[assessment.recommendedNextAction]}
          </span>
        </div>
        <p className="mt-4 text-base leading-7 text-[#294b3f]">{assessment.microLesson}</p>
        <div className="mt-5 border-t border-[#d2ded7] pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6a7c73]">
            Recommended next concept
          </p>
          <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[#173d32]">
            {assessment.recommendedNextConcept}
          </p>
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-[#d6ddc7] bg-[#f5f7e9] p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e7c4f]">
          Check your understanding
        </p>
        <p className="mt-3 text-lg font-semibold leading-7 tracking-[-0.02em] text-[#31432a]">
          {assessment.followUpQuestion}
        </p>
        <p className="mt-3 text-xs leading-5 text-[#77816d]">
          This is the handoff for the next learning round. Multi-round teaching is intentionally not started yet.
        </p>
      </section>

      <details open className="mt-7 rounded-2xl border border-[#dfe4dd] bg-white">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#315447] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315e4f]">
          Reveal what the diagnostic was checking
        </summary>
        <div className="border-t border-[#e7eae5] px-5 py-5">
          <div className="rounded-xl border border-[#dfe5df] bg-[#f8faf6] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#728078]">
              Why this question was useful
            </p>
            <p className="mt-2 text-xs leading-5 text-[#65726b]">
              {plan.diagnosticQuestion.whyUseful}
            </p>
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#728078]">
            Relevant prerequisites
          </p>
          <div className="mt-3 space-y-3">
            {plan.prerequisiteConcepts.map((concept, index) => (
              <div key={`${concept.name}-${index}`} className="rounded-xl bg-[#f6f8f3] p-4">
                <p className="text-sm font-semibold text-[#29483d]">{concept.name}</p>
                <p className="mt-1 text-xs leading-5 text-[#6f7b74]">{concept.relevance}</p>
              </div>
            ))}
          </div>

          {plan.misconceptionHypotheses.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#997657]">
                Original hypotheses · still not assumed true
              </p>
              <div className="mt-3 space-y-3">
                {plan.misconceptionHypotheses.map((hypothesis, index) => (
                  <div key={`${hypothesis.statement}-${index}`} className="rounded-xl bg-[#fff8ef] p-4">
                    <p className="text-sm font-semibold text-[#664d39]">{hypothesis.statement}</p>
                    <p className="mt-1 text-xs leading-5 text-[#85705e]">{hypothesis.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-[#e1e6e0] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#728078]">
              Why your selected option was informative
            </p>
            <p className="mt-2 text-xs leading-5 text-[#65726b]">{optionInterpretation}</p>
          </div>
        </div>
      </details>

      {!lab && labState !== "loading" && (
        <section className="mt-7 overflow-hidden rounded-3xl bg-[#173f34] p-6 text-white shadow-[0_18px_45px_rgba(23,63,52,0.16)] sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#cbdc8e]">
            Interactive Learning Lab
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
            Turn the next concept into something you can manipulate.
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#d6e1dc]">
            MindLoom will create one prediction-first lab adapted to this assessment. It only contacts Meta when you choose to continue.
          </p>
          {labState === "error" && (
            <div className="mt-5 rounded-2xl border border-[#f0c8b7]/40 bg-[#fff4ee] px-4 py-3 text-sm leading-6 text-[#7d4936]" role="alert">
              {labError}
            </div>
          )}
          <button
            type="button"
            onClick={onExplore}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#e7f2a8] px-6 py-3 text-sm font-bold text-[#173f34] transition hover:bg-[#f0f7c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {labState === "error" ? "Retry Learning Lab" : "Explore this concept"}
            <ArrowIcon />
          </button>
        </section>
      )}

      {labState === "loading" && (
        <section className="mt-7 rounded-3xl border border-[#dce3dd] bg-white p-6" role="status" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#9eafa5] border-t-[#315e4f]" />
            <div>
              <p className="text-sm font-semibold text-[#29483d]">Designing your interactive lab</p>
              <p className="mt-1 text-xs text-[#7a857f]">Choosing one safe simulation for your next concept…</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </div>
        </section>
      )}

      {lab && <LearningLab lab={lab} />}
    </div>
  );
}

export function DiagnosticWorkspace() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("English");
  const [diagnoseState, setDiagnoseState] = useState<AsyncState>("idle");
  const [evaluationState, setEvaluationState] = useState<AsyncState>("idle");
  const [plan, setPlan] = useState<DiagnosticPlan | null>(null);
  const [assessment, setAssessment] = useState<AdaptiveAssessment | null>(null);
  const [diagnosedQuestion, setDiagnosedQuestion] = useState("");
  const [diagnosedLanguage, setDiagnosedLanguage] =
    useState<SupportedLanguage>("English");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const [diagnoseError, setDiagnoseError] = useState("");
  const [evaluationError, setEvaluationError] = useState("");
  const [lab, setLab] = useState<LearningLabSpec | null>(null);
  const [labState, setLabState] = useState<AsyncState>("idle");
  const [labError, setLabError] = useState("");

  const currentStep = getJourneyStep(Boolean(plan), Boolean(assessment));

  async function handleDiagnose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (
      trimmedQuestion.length < 8 ||
      trimmedQuestion.length > 2000 ||
      diagnoseState === "loading"
    ) {
      return;
    }

    setDiagnoseState("loading");
    setDiagnoseError("");

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion, language }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const parsedError = diagnoseErrorSchema.safeParse(body);
        throw new Error(
          parsedError.success
            ? parsedError.data.error
            : "The diagnostic request could not be completed.",
        );
      }

      const parsedResponse = diagnoseSuccessSchema.safeParse(body);

      if (!parsedResponse.success) {
        throw new Error("The learning engine returned an unexpected response.");
      }

      setPlan(parsedResponse.data.plan);
      setDiagnosedQuestion(trimmedQuestion);
      setDiagnosedLanguage(language);
      setSelectedOptionIndex(null);
      setExplanation("");
      setAssessment(null);
      setEvaluationState("idle");
      setLab(null);
      setLabState("idle");
      setLabError("");
      setDiagnoseState("success");
    } catch (error) {
      setDiagnoseError(
        error instanceof Error
          ? error.message
          : "Something unexpected happened. Please try again.",
      );
      setDiagnoseState("error");
    }
  }

  async function handleEvaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !plan ||
      !canSubmitEvaluation(
        selectedOptionIndex,
        explanation,
        evaluationState === "loading",
      )
    ) {
      return;
    }

    setEvaluationState("loading");
    setEvaluationError("");

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalQuestion: diagnosedQuestion,
          language: diagnosedLanguage,
          plan,
          selectedOptionIndex,
          explanation: explanation.trim(),
        }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const parsedError = diagnoseErrorSchema.safeParse(body);
        throw new Error(
          parsedError.success
            ? parsedError.data.error
            : "The assessment request could not be completed.",
        );
      }

      const parsedResponse = evaluateSuccessSchema.safeParse(body);

      if (!parsedResponse.success) {
        throw new Error("The assessment engine returned an unexpected response.");
      }

      setAssessment(parsedResponse.data.assessment);
      setLab(null);
      setLabState("idle");
      setLabError("");
      setEvaluationState("success");
    } catch (error) {
      setEvaluationError(
        error instanceof Error
          ? error.message
          : "Something unexpected happened. Please try again.",
      );
      setEvaluationState("error");
    }
  }

  async function handleExplore() {
    if (!assessment || labState === "loading" || lab) {
      return;
    }

    setLabState("loading");
    setLabError("");

    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalLearningGoal: diagnosedQuestion,
          language: diagnosedLanguage,
          assessment,
          recommendedNextConcept: assessment.recommendedNextConcept,
          recommendedNextAction: assessment.recommendedNextAction,
        }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const parsedError = diagnoseErrorSchema.safeParse(body);
        throw new Error(
          parsedError.success
            ? parsedError.data.error
            : "The learning lab request could not be completed.",
        );
      }

      const parsedResponse = labSuccessSchema.safeParse(body);

      if (!parsedResponse.success) {
        throw new Error("The learning lab engine returned an unexpected response.");
      }

      setLab(parsedResponse.data.lab);
      setLabState("success");
    } catch (error) {
      setLabError(
        error instanceof Error
          ? error.message
          : "Something unexpected happened. Please try again.",
      );
      setLabState("error");
    }
  }

  function handleStartOver() {
    setPlan(null);
    setAssessment(null);
    setSelectedOptionIndex(null);
    setExplanation("");
    setDiagnoseError("");
    setEvaluationError("");
    setDiagnoseState("idle");
    setEvaluationState("idle");
    setLab(null);
    setLabState("idle");
    setLabError("");
  }

  return (
    <div className="mindloom-grid min-h-screen bg-[#f4f5ef] text-[#18342c]">
      <header className="border-b border-[#dfe4dc]/80 bg-[#f8f9f4]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#153f33] text-[#e9f4a7] shadow-[0_8px_24px_rgba(21,63,51,0.18)]">
              <LogoMark />
            </span>
            <div>
              <p className="text-base font-bold tracking-[-0.03em] text-[#173d32]">MindLoom</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a867f]">
                Adaptive understanding
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#d9dfd7] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#5f7067] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7ea052]" />
            Assessment engine
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-14 pt-10 sm:px-8 sm:pt-14 lg:px-12 lg:pb-20">
        <section className="max-w-4xl">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#6c7d73]">
            <span className="h-px w-8 bg-[#9daa91]" />
            Adaptive Learning Lab · Milestone 04
          </div>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.45rem,5.5vw,5.2rem)] font-semibold leading-[0.99] tracking-[-0.062em] text-[#163a30]">
            Understand it by changing it, comparing it, and seeing why.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#66736c] sm:text-lg sm:leading-8">
            MindLoom diagnoses your reasoning, then turns the next concept into a prediction-first interactive model built for your current understanding.
          </p>
        </section>

        <div className="mt-9 max-w-3xl">
          <JourneySteps currentStep={currentStep} />
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(310px,0.7fr)_minmax(560px,1.3fr)] xl:gap-8">
          <aside className="rounded-[28px] border border-[#dfe4dc] bg-white/90 p-5 shadow-[0_24px_70px_rgba(38,63,51,0.08)] sm:p-7 lg:sticky lg:top-6">
            {plan ? (
              <GoalSummary
                goal={plan.intendedGoal}
                language={diagnosedLanguage}
                onStartOver={handleStartOver}
              />
            ) : (
              <GoalForm
                question={question}
                language={language}
                requestState={diagnoseState}
                errorMessage={diagnoseError}
                onQuestionChange={setQuestion}
                onLanguageChange={setLanguage}
                onSubmit={handleDiagnose}
              />
            )}
          </aside>

          <section
            className="overflow-hidden rounded-[28px] border border-[#dfe4dc] bg-[#fbfcf9] shadow-[0_24px_70px_rgba(38,63,51,0.08)]"
            aria-busy={
              diagnoseState === "loading" ||
              evaluationState === "loading" ||
              labState === "loading"
            }
            aria-label="Adaptive diagnostic journey"
          >
            <div className="flex items-center justify-between border-b border-[#e2e6e0] bg-white/80 px-5 py-4 sm:px-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c8881]">
                  Understanding journey
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#28483d]">
                  Goal → evidence → adaptive next step
                </p>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-[#d8ddcd]" />
                <span className="h-2 w-2 rounded-full bg-[#afc491]" />
                <span className="h-2 w-2 rounded-full bg-[#547565]" />
              </div>
            </div>

            {!plan && diagnoseState !== "loading" && <EmptyState />}
            {!plan && diagnoseState === "loading" && <LoadingPlan />}
            {plan && !assessment && (
              <DiagnosticAssessment
                plan={plan}
                selectedOptionIndex={selectedOptionIndex}
                explanation={explanation}
                requestState={evaluationState}
                errorMessage={evaluationError}
                onSelectOption={setSelectedOptionIndex}
                onExplanationChange={setExplanation}
                onSubmit={handleEvaluate}
              />
            )}
            {plan && assessment && selectedOptionIndex !== null && (
              <AssessmentResult
                plan={plan}
                assessment={assessment}
                selectedOptionIndex={selectedOptionIndex}
                lab={lab}
                labState={labState}
                labError={labError}
                onExplore={handleExplore}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
