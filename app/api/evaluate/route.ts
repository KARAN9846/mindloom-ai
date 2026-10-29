import { APIError } from "openai";
import { ZodError } from "zod";

import {
  AdaptiveAssessmentGenerationError,
  evaluateLearnerResponse,
} from "@/lib/adaptive-assessment-engine";
import { evaluateRequestSchema } from "@/lib/diagnostic-schema";
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

  const requestResult = evaluateRequestSchema.safeParse(body);

  if (!requestResult.success) {
    return Response.json(
      {
        error: "Please check the selected answer and explanation.",
        fieldErrors: requestResult.error.flatten().fieldErrors,
      },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const assessment = await evaluateLearnerResponse(requestResult.data);

    return Response.json({ assessment }, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof MetaApiConfigurationError) {
      return Response.json(
        { error: error.message },
        { status: 503, headers: responseHeaders },
      );
    }

    if (error instanceof AdaptiveAssessmentGenerationError) {
      console.error("Meta adaptive assessment response was incomplete.", error.metadata);

      return Response.json(
        { error: "The assessment could not be completed. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    if (error instanceof APIError) {
      console.error("Meta adaptive assessment request failed.", {
        status: error.status ?? null,
        sdkErrorType: error.name,
        upstreamErrorType: error.type ?? null,
        errorCode: error.code ?? null,
        requestId: error.requestID ?? null,
      });

      return Response.json(
        { error: "The assessment engine is unavailable right now. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    if (error instanceof ZodError) {
      console.error("Meta adaptive assessment failed schema validation.", {
        sdkErrorType: error.name,
        issueCount: error.issues.length,
      });

      return Response.json(
        { error: "The assessment had an unexpected format. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    console.error("Unexpected adaptive assessment error.", {
      sdkErrorType: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      { error: "Unable to assess this response right now." },
      { status: 500, headers: responseHeaders },
    );
  }
}
