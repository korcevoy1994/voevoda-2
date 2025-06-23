import React from "react";

interface TicketBannerProps {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  organizerLogos: string[];
  buyLink: string;
}

const TicketBanner: React.FC<TicketBannerProps> = ({
  eventTitle,
  eventDate,
  eventTime,
  organizerLogos,
  buyLink,
}) => (
  <div className="w-full bg-white rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between px-8 py-6 mb-6 gap-4">
    <div className="flex flex-col gap-1 items-start">
      <div className="text-sm text-gray-500 font-medium uppercase tracking-widest">{eventDate} • {eventTime}</div>
      <div className="text-3xl md:text-4xl font-extrabold text-black leading-tight">{eventTitle}</div>
    </div>
    <div className="flex flex-col md:items-end items-start gap-2">
      <div className="flex gap-2">
        {organizerLogos.map((logo, i) => (
          <img key={i} src={logo} alt="Организатор" className="h-10 w-auto rounded bg-gray-100 object-contain" />
        ))}
      </div>
      <a href={buyLink} target="_blank" rel="noopener noreferrer" className="text-yellow-500 font-bold text-sm underline hover:text-yellow-600 transition">Купить на festivlul-lupilor.md</a>
    </div>
  </div>
);

export default TicketBanner; 