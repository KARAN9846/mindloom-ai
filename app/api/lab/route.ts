import { APIError } from "openai";
import { ZodError } from "zod";

import {
  generateLearningLab,
  LearningLabGenerationError,
} from "@/lib/learning-lab-engine";
import { labRequestSchema } from "@/lib/learning-lab-schema";
import { MetaApiConfigurationError } from "@/lib/meta-client";

const responseHeaders = { "Cache-Control": "no-store" };

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

  const requestResult = labRequestSchema.safeParse(body);

  if (!requestResult.success) {
    return Response.json(
      {
        error: "Please check the learning goal and adaptive assessment.",
        fieldErrors: requestResult.error.flatten().fieldErrors,
      },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const lab = await generateLearningLab(requestResult.data);
    return Response.json({ lab }, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof MetaApiConfigurationError) {
      return Response.json(
        { error: error.message },
        { status: 503, headers: responseHeaders },
      );
    }

    if (error instanceof LearningLabGenerationError) {
      console.error("Meta learning lab response was incomplete or incompatible.", error.metadata);
      return Response.json(
        { error: "The learning lab could not be completed. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    if (error instanceof APIError) {
      console.error("Meta learning lab request failed.", {
        status: error.status ?? null,
        sdkErrorType: error.name,
        upstreamErrorType: error.type ?? null,
        errorCode: error.code ?? null,
        requestId: error.requestID ?? null,
      });
      return Response.json(
        { error: "The learning lab engine is unavailable right now. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    if (error instanceof ZodError) {
      console.error("Meta learning lab failed schema validation.", {
        sdkErrorType: error.name,
        issueCount: error.issues.length,
      });
      return Response.json(
        { error: "The learning lab had an unexpected format. Please try again." },
        { status: 502, headers: responseHeaders },
      );
    }

    console.error("Unexpected learning lab engine error.", {
      sdkErrorType: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: "Unable to create a learning lab right now." },
      { status: 500, headers: responseHeaders },
    );
  }
}

