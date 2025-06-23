import React from "react";

interface TicketLegendProps {
  prices: { color: string; label: string }[];
}

const TicketLegend: React.FC<TicketLegendProps> = ({ prices }) => (
  <div className="flex flex-row gap-6 items-center mb-6">
    {prices.map((p, i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full" style={{ background: p.color }}></span>
        <span className="text-sm font-medium text-gray-700">{p.label}</span>
      </div>
    ))}
  </div>
);

export default TicketLegend; 