import { Event, Performer, PriceRange } from '@/lib/types'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface EventDetailsProps {
  event: Event
  performers: Performer[]
  priceRange: PriceRange
}

export default function EventDetails({
  event,
  performers,
  priceRange,
}: EventDetailsProps) {
  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-5xl font-extrabold mb-6 text-gray-800 tracking-tight">
        {event.name}
      </h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-700 border-b-2 border-gray-200 pb-2 mb-4">
            О мероприятии
          </h2>
          <p className="text-lg">
            <strong>Место проведения:</strong> {event.venue_name}
          </p>
          <p className="text-lg">
            <strong>Адрес:</strong> {event.venue_address}
          </p>
          <p className="text-lg">
            <strong>Дата и время:</strong>{' '}
            {format(new Date(event.event_date), 'dd MMMM yyyy - HH:mm', {
              locale: ru,
            })}
          </p>
          <p className="text-lg">
            <strong>Телефон:</strong> {event.phone_number}
          </p>
          <p className="text-lg">
            <strong>Стоимость билетов:</strong> от {priceRange.min_price} до{' '}
            {priceRange.max_price} MDL
          </p>
          {event.description && (
            <p className="mt-4 text-gray-600">{event.description}</p>
          )}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-700 border-b-2 border-gray-200 pb-2 mb-4">
            Исполнители
          </h2>
          {performers.map((performer) => (
            <div key={performer.id} className="flex items-center gap-6">
              {performer.image_url && (
                <Image
                  src={performer.image_url}
                  alt={performer.name}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-gray-200"
                />
              )}
              <span className="text-2xl font-semibold text-gray-800">
                {performer.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 