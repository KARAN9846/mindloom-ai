import { APIError } from "openai";
import { ZodError } from "zod";

import {
  DiagnosticGenerationError,
  generateDiagnosticPlan,
} from "@/lib/diagnostic-engine";
import { diagnoseRequestSchema } from "@/lib/diagnostic-schema";
import { MetaApiConfigurationError } from "@/lib/meta-client";

const responseHeaders = {
  "Cache-Control": "no-store",
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400, headers: responseHeaders },
    );
  }

  const requestResult = diagnoseRequestSchema.safeParse(body);

  if (!requestResult.success) {
    return Response.json(
      {
        error: "Please check your question and language selection.",
        fieldErrors: requestResult.error.flatten().fieldErrors,
      },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const plan = await generateDiagnosticPlan(requestResult.data);

    return Response.json({ plan }, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof MetaApiConfigurationError) {
      return Response.json(
        { error: error.message },
        { status: 503, headers: responseHeaders },
      );
    }

    if (error instanceof DiagnosticGenerationError) {
      console.error("Meta diagnostic response was incomplete.", error.metadata);

      return Response.json(
        { error: "The diagnostic plan could not be completed. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    if (error instanceof APIError) {
      console.error("Meta diagnostic request failed.", {
        status: error.status ?? null,
        sdkErrorType: error.name,
        upstreamErrorType: error.type ?? null,
        errorCode: error.code ?? null,
        requestId: error.requestID ?? null,
      });

      return Response.json(
        { error: "The learning engine is unavailable right now. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    if (error instanceof ZodError) {
      console.error("Meta diagnostic output failed schema validation.", {
        sdkErrorType: error.name,
        issueCount: error.issues.length,
      });

      return Response.json(
        { error: "The diagnostic plan had an unexpected format. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    console.error("Unexpected diagnostic engine error.", {
      sdkErrorType: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      { error: "Unable to create a diagnostic plan right now." },
      { status: 500, headers: responseHeaders },
    );
  }
}
