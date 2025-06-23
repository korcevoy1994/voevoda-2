import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MAIB = require("nodejs-maib");

const CERT_PATH = path.resolve(process.cwd(), "certs/0149583.pem");
const CERT_PASS = "Za86DuC$";
const MERCHANT_HANDLER = "https://maib.ecommerce.md:21440/ecomm/MerchantHandler";

const maib = new MAIB(CERT_PATH, CERT_PASS, MERCHANT_HANDLER);

export async function POST(req: NextRequest) {
  try {
    // MAIB обычно шлёт transactionId (trans_id) в теле или query
    let transactionId = null;
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();
      transactionId = body.trans_id || body.transactionId;
    } else {
      const form = await req.formData();
      transactionId = form.get("trans_id") || form.get("transactionId");
    }
    if (!transactionId) {
      return NextResponse.json({ error: "No transactionId (trans_id) provided" }, { status: 400 });
    }
    // Проверяем статус транзакции через MAIB SDK
    const status = await maib.getTransactionStatus(transactionId);
    // TODO: тут обновить заказ в БД по transactionId/status
    return NextResponse.json({ status });
  } catch (e) {
    console.error("MAIB callback error:", e);
    return NextResponse.json({ error: "Callback exception", details: String(e) }, { status: 500 });
  }
} 