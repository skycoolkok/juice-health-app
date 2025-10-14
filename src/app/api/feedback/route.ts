import { NextRequest, NextResponse } from "next/server";

const READONLY_RESPONSE = {
  ok: true,
  readonly: true,
  message: "Staging: writes are disabled",
};

function maybeReadonlyResponse() {
  if (process.env.PROD_READONLY === "true") {
    return NextResponse.json(READONLY_RESPONSE);
  }
  return null;
}

export async function POST(_request: NextRequest) {
  const readonly = maybeReadonlyResponse();
  if (readonly) return readonly;
  return NextResponse.json({ ok: true });
}

export async function PUT(_request: NextRequest) {
  const readonly = maybeReadonlyResponse();
  if (readonly) return readonly;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const readonly = maybeReadonlyResponse();
  if (readonly) return readonly;
  return NextResponse.json({ ok: true });
}
