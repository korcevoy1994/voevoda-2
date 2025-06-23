import React from "react";
import Image from "next/image";
import { FaTicketAlt } from "react-icons/fa";

interface TicketHeaderProps {
  eventTitle: string;
  eventDate: string;
  venue: string;
  minPrice: number;
  maxPrice: number;
}

const TicketHeader: React.FC<TicketHeaderProps> = ({
  eventTitle,
  eventDate,
  venue,
  minPrice,
  maxPrice,
}) => {
  return (
    <div className="w-full flex flex-col items-center bg-[#222] py-8 px-2 md:px-0">
      <div className="bg-black rounded-2xl shadow-lg overflow-hidden w-full max-w-5xl">
        {/* Banner image */}
        <div className="w-full bg-gray-900 flex items-center justify-center p-4 pb-0">
          <Image
            src="/placeholder.jpg"
            alt="Event banner"
            width={1200}
            height={400}
            className="rounded-xl object-cover w-full h-48 md:h-64"
            priority
          />
        </div>
        {/* Info bar */}
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between bg-black px-8 py-6 mt-0">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-400 tracking-widest uppercase">КОНЦЕРТ</div>
            <div className="text-3xl md:text-4xl font-bold text-white tracking-widest">{eventTitle}</div>
            <div className="text-md text-gray-200">{eventDate}</div>
            <div className="text-md text-gray-400">{venue}</div>
          </div>
          <div className="flex justify-end w-full md:w-auto mt-4 md:mt-0">
            <span className="inline-flex items-center bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg text-sm shadow">
              <FaTicketAlt className="mr-2" />
              {minPrice} - {maxPrice} LEI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketHeader; 