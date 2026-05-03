import { NextResponse } from "next/server";

import { CSV_TEMPLATE } from "@/lib/csv";

export async function GET() {
  return new NextResponse(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kinetik-routine-template.csv"'
    }
  });
}
