import { NextRequest, NextResponse } from "next/server";

const IMGBB_API = "https://api.imgbb.com/1/upload";
const IMGBB_KEY = process.env.IMGBB_API_KEY || "";

export async function POST(request: NextRequest) {
  if (!IMGBB_KEY) {
    return NextResponse.json(
      { error: "IMGBB_API_KEY non configurata. Aggiungi la chiave in .env.local" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File immagine richiesto" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const body = new URLSearchParams();
  body.set("key", IMGBB_KEY);
  body.set("image", base64);

  try {
    const res = await fetch(IMGBB_API, {
      method: "POST",
      body,
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      return NextResponse.json(
        { error: json.error?.message || "Upload ImgBB fallito" },
        { status: res.status }
      );
    }

    return NextResponse.json({ url: json.data.url });
  } catch (e) {
    return NextResponse.json(
      { error: "Errore durante l'upload" },
      { status: 500 }
    );
  }
}
