import { APIError } from "openai";
import type { Response as MetaResponse } from "openai/resources/responses/responses";

import {
  createMetaClient,
  META_MODEL,
  MetaApiConfigurationError,
} from "@/lib/meta-client";

const TEST_PROMPT =
  "In two short sentences, explain why retrieval practice improves learning.";

const responseHeaders = {
  "Cache-Control": "no-store",
};

function extractVisibleText(response: MetaResponse): string {
  const outputText = response.output_text?.trim();

  if (outputText) {
    return outputText;
  }

  return response.output
    .flatMap((item) =>
      item.type === "message"
        ? item.content
            .filter((part) => part.type === "output_text")
            .map((part) => part.text)
        : [],
    )
    .join("\n")
    .trim();
}

function getSafeResponseMetadata(response: MetaResponse) {
  return {
    status: response.status ?? null,
    incompleteReason: response.incomplete_details?.reason ?? null,
    outputItemTypes: response.output.map((item) => item.type),
    outputContentPartTypes: response.output.flatMap((item) =>
      item.type === "message" ? item.content.map((part) => part.type) : [],
    ),
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
    reasoningTokens:
      response.usage?.output_tokens_details.reasoning_tokens ?? null,
  };
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Not found." },
      { status: 404, headers: responseHeaders },
    );
  }

  try {
    const client = createMetaClient();
    const metaResponse = await client.responses.create({
      model: META_MODEL,
      input: TEST_PROMPT,
      reasoning: { effort: "minimal" },
      max_output_tokens: 1024,
      store: false,
    });
    const response = extractVisibleText(metaResponse);

    if (!response) {
      const metadata = getSafeResponseMetadata(metaResponse);

      console.error("Meta Model API returned no visible response text.", metadata);

      return Response.json(
        {
          error:
            metaResponse.status === "incomplete"
              ? "Meta Model API response was incomplete."
              : metaResponse.status && metaResponse.status !== "completed"
                ? "Meta Model API response did not complete."
              : "Meta Model API returned no visible response text.",
          providerStatus: metadata.status,
          incompleteReason: metadata.incompleteReason,
        },
        { status: 502, headers: responseHeaders },
      );
    }

    return Response.json(
      {
        model: metaResponse.model,
        response,
        status: metaResponse.status ?? null,
        incompleteReason: metaResponse.incomplete_details?.reason ?? null,
        usage: metaResponse.usage
          ? {
              inputTokens: metaResponse.usage.input_tokens,
              outputTokens: metaResponse.usage.output_tokens,
              reasoningTokens:
                metaResponse.usage.output_tokens_details.reasoning_tokens,
              totalTokens: metaResponse.usage.total_tokens,
            }
          : null,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    if (error instanceof MetaApiConfigurationError) {
      return Response.json(
        { error: error.message },
        { status: 503, headers: responseHeaders },
      );
    }

    if (error instanceof APIError) {
      console.error("Meta Model API request failed.", {
        status: error.status ?? null,
        sdkErrorType: error.name,
        upstreamErrorType: error.type ?? null,
        errorCode: error.code ?? null,
        requestId: error.requestID ?? null,
      });

      return Response.json(
        {
          error: "Meta Model API request failed.",
          providerStatus: error.status ?? null,
          requestId: error.requestID ?? null,
        },
        { status: 502, headers: responseHeaders },
      );
    }

    console.error("Unexpected Meta Model API error.", {
      status: null,
      sdkErrorType: error instanceof Error ? error.name : "UnknownError",
      upstreamErrorType: null,
      errorCode: null,
      requestId: null,
    });

    return Response.json(
      { error: "Unable to contact the Meta Model API." },
      { status: 502, headers: responseHeaders },
    );
  }
}
