import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MAIB = require("nodejs-maib");

const CERT_PATH = path.resolve(process.cwd(), "certs/0149583.pem");
const CERT_PASS = "Za86DuC$";
const MERCHANT_HANDLER = "https://maib.ecommerce.md:21440/ecomm/MerchantHandler";
const CLIENT_HANDLER = "https://maib.ecommerce.md:21443/ecomm/ClientHandler";

const maib = new MAIB(CERT_PATH, CERT_PASS, MERCHANT_HANDLER);

export async function POST(req: NextRequest) {
  const { amount, description, clientIp } = await req.json();

  try {
    const result = await maib
      .setDescription(description || "Покупка билета")
      .setClientIpAddress(clientIp || "127.0.0.1")
      .setLanguage("ru")
      .setCurrency(498) // MDL
      .setAmount(amount)
      .createTransaction();

    if (!result.TRANSACTION_ID) {
      return NextResponse.json({ error: "MAIB error", details: result }, { status: 500 });
    }

    // Ссылка для оплаты
    const paymentUrl = `${CLIENT_HANDLER}?trans_id=${result.TRANSACTION_ID}`;

    return NextResponse.json({ paymentUrl, transactionId: result.TRANSACTION_ID });
  } catch (e) {
    console.error("MAIB exception:", e);
    return NextResponse.json({ error: "MAIB exception", details: String(e) }, { status: 500 });
  }
} 