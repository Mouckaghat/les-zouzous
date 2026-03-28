import { NextRequest, NextResponse } from "next/server";

type RequestBody = {
  text?: string;
  source?: string;
  target?: string;
};

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const text = body.text?.trim() ?? "";
    const source = body.source?.trim() ?? "auto";
    const target = body.target?.trim() ?? "";

    if (!text) {
      return NextResponse.json({ error: "Missing text." }, { status: 400 });
    }

    if (!target) {
      return NextResponse.json({ error: "Missing target language." }, { status: 400 });
    }

    const apiKey = process.env.DEEPL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPL_API_KEY is missing on the server." },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("target_lang", target.toUpperCase());

    if (source.toLowerCase() !== "auto") {
      params.append("source_lang", source.toUpperCase());
    }

    const response = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Translation request failed."
        },
        { status: response.status }
      );
    }

    const translated = data?.translations?.[0]?.text ?? "";

    return NextResponse.json({
      translated
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error during translation." },
      { status: 500 }
    );
  }
}
