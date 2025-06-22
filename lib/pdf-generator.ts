import { PDFDocument, rgb, degrees } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";
import type { Order, OrderItemWithSeatDetails } from "@/lib/types";
import * as fontkit from 'fontkit';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export async function generateTicketPdf(
  order: Order,
  items: OrderItemWithSeatDetails[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit as any);

  // 1. Загрузка шрифтов
  const regularFontPath = path.join(process.cwd(), "public", "fonts", "Montserrat-Regular.ttf");
  const boldFontPath = path.join(process.cwd(), "public", "fonts", "Montserrat-Bold.ttf");

  const regularFontBytes = await fs.readFile(regularFontPath);
  const boldFontBytes = await fs.readFile(boldFontPath);

  const montserratRegular = await pdfDoc.embedFont(regularFontBytes);
  const montserratBold = await pdfDoc.embedFont(boldFontBytes);

  // 2. Определение цветов и констант
  const black = rgb(0, 0, 0);
  const gray = rgb(0.85, 0.85, 0.85); // Светло-серый для линии отрыва

  for (const item of items) {
    // Используем альбомный формат, похожий на билет
    const page = pdfDoc.addPage([842, 396]); // Широкий формат
    const { width, height } = page.getSize();
    const stubWidth = 242; // Ширина отрывной части
    const mainWidth = width - stubWidth;

    // Пунктирная линия отрыва
    for (let y = 20; y < height - 20; y += 20) {
      page.drawLine({
        start: { x: mainWidth, y },
        end: { x: mainWidth, y: y + 10 },
        thickness: 2,
        color: gray,
      });
    }

    // --- Левая (основная) часть билета ---

    // Название мероприятия
    page.drawText('VOEVODA', {
      x: 40,
      y: height - 80,
      font: montserratBold,
      size: 60,
      color: black,
    });
    // Локация
    page.drawText('Chisinau Arena', {
      x: 40,
      y: height - 120,
      font: montserratRegular,
      size: 28,
      color: black,
    });

    // Дата и время
    const eventDate = new Date(); // Замените на реальную дату события
    const dateText = format(eventDate, 'dd MMM yyyy').toUpperCase();
    const timeText = format(eventDate, 'HH:mm');
    page.drawText(`${dateText}`, { x: mainWidth - 180, y: height - 70, font: montserratBold, size: 20 });
    page.drawText(timeText, { x: mainWidth - 180, y: height - 100, font: montserratBold, size: 20 });


    // Нижняя часть
    const bottomY = 60;
    
    // QR-код
    const qrData = JSON.stringify({ orderId: order.id, seatId: item.seat.id });
    const qrImage = await QRCode.toDataURL(qrData, { width: 140, margin: 1 });
    const qrImageBytes = Buffer.from(qrImage.split(",")[1], "base64");
    const embeddedQrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(embeddedQrImage, { x: 40, y: bottomY, width: 120, height: 120 });
    
    // ID заказа
    page.drawText(`#${order.id.substring(0, 9)}`, {
        x: 40,
        y: bottomY - 15,
        font: montserratRegular,
        size: 12,
        color: black,
    });

    // GATE, SEAT, ROW
    const infoX = 200;
    page.drawText('GATE', { x: infoX, y: bottomY + 80, font: montserratRegular, size: 20, color: black });
    page.drawText(item.seat.zone.name, { x: infoX, y: bottomY + 50, font: montserratBold, size: 28, color: black });
    
    page.drawText('SEAT', { x: infoX + 150, y: bottomY + 80, font: montserratRegular, size: 20, color: black });
    page.drawText(String(item.seat.seat_number), { x: infoX + 150, y: bottomY + 50, font: montserratBold, size: 28, color: black });

    page.drawText('ROW', { x: infoX + 300, y: bottomY + 80, font: montserratRegular, size: 20, color: black });
    page.drawText(String(item.seat.row_number), { x: infoX + 300, y: bottomY + 50, font: montserratBold, size: 28, color: black });


    // --- Правая (отрывная) часть билета ---
    const stubX = mainWidth + 40;

    page.drawText('VOEVODA', { x: stubX, y: height - 60, font: montserratBold, size: 24, color: black });
    page.drawText('Chisinau Arena', { x: stubX, y: height - 85, font: montserratRegular, size: 14, color: black });

    page.drawText(`${dateText} ${timeText}`, { x: stubX, y: height - 120, font: montserratBold, size: 14 });

    const stubInfoY = height - 160;
    page.drawText('GATE', { x: stubX, y: stubInfoY, font: montserratRegular, size: 14, color: black });
    page.drawText(item.seat.zone.name, { x: stubX + 60, y: stubInfoY, font: montserratBold, size: 14, color: black });

    page.drawText('SEAT', { x: stubX, y: stubInfoY - 25, font: montserratRegular, size: 14, color: black });
    page.drawText(String(item.seat.seat_number), { x: stubX + 60, y: stubInfoY - 25, font: montserratBold, size: 14, color: black });
    
    page.drawText('ROW', { x: stubX, y: stubInfoY - 50, font: montserratRegular, size: 14, color: black });
    page.drawText(String(item.seat.row_number), { x: stubX + 60, y: stubInfoY - 50, font: montserratBold, size: 14, color: black });

    page.drawImage(embeddedQrImage, { x: stubX, y: 40, width: 80, height: 80 });
    page.drawText(`#${order.id.substring(0, 9)}`, { x: stubX, y: 25, font: montserratRegular, size: 10, color: black });
  }

  return pdfDoc.save();
}