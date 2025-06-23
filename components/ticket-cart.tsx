import React from "react";
import { XIcon } from "lucide-react";

interface TicketCartProps {
  tickets: Array<{
    id: string;
    sector: string;
    date: string;
    time: string;
    row: string;
    seat: string;
    price: number;
  }>;
  total: number;
  onRemove: (id: string) => void;
  onPay: () => void;
}

const TicketCart: React.FC<TicketCartProps> = ({ tickets, total, onRemove, onPay }) => (
  <aside className="bg-black rounded-2xl shadow-xl p-6 flex flex-col w-full max-w-xs min-w-[270px] mx-auto md:mx-0">
    <div className="text-white text-xl font-bold mb-4 tracking-wide">Выбранные билеты</div>
    <div className="flex-1 flex flex-col gap-4 mb-4">
      {tickets.length === 0 ? (
        <div className="text-gray-400 text-center py-12">Нет выбранных билетов</div>
      ) : (
        tickets.map(ticket => (
          <div key={ticket.id} className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{ticket.sector}</span>
              <button onClick={() => onRemove(ticket.id)} className="ml-auto p-1 rounded-full hover:bg-yellow-400 transition group">
                <XIcon className="h-5 w-5 text-yellow-400 group-hover:text-black" />
              </button>
            </div>
            <div className="flex flex-row gap-4 text-xs text-gray-400">
              <span>{ticket.date}</span>
              <span>{ticket.time}</span>
            </div>
            <div className="flex flex-row gap-4 items-end mt-1">
              <span className="text-white font-semibold text-sm">Ряд {ticket.row}</span>
              <span className="text-white font-semibold text-sm">Место {ticket.seat}</span>
              <span className="ml-auto text-yellow-400 font-bold text-lg">{ticket.price} лей</span>
            </div>
          </div>
        ))
      )}
    </div>
    <div className="pt-4 border-t border-gray-800">
      <button
        onClick={onPay}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-3 rounded-xl transition mb-2"
        disabled={tickets.length === 0}
      >
        ОПЛАТИТЬ
      </button>
      <div className="text-white text-lg font-bold text-center">
        {total > 0 ? `Сумма: ${total} лей` : ""}
      </div>
    </div>
  </aside>
);

export default TicketCart; 