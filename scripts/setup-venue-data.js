const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupVenueData() {
  try {
    console.log('Настройка данных зон и мест...')

    // Получаем или создаем событие
    let { data: events, error: eventError } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (eventError) {
      console.error('Ошибка получения событий:', eventError)
      return
    }

    let eventId
    if (events && events.length > 0) {
      eventId = events[0].id
      console.log('Используем существующее событие:', eventId)
    } else {
      // Создаем новое событие
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert({
          title: 'Тестовый концерт',
          description: 'Тестовое событие для демонстрации системы бронирования',
          event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Главная арена',
          poster_url: 'https://example.com/poster.jpg'
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Ошибка создания события:', createError)
        return
      }

      eventId = newEvent.id
      console.log('Создано новое событие:', eventId)
    }

    // Очищаем существующие данные
    console.log('Очистка существующих данных...')
    await supabase.from('seats').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('zones').delete().eq('event_id', eventId)

    // Добавляем зоны
    console.log('Добавление зон...')
    const zones = [
      // VIP зоны
      { name: 'VIP 1', price: 15000, color: '#FFB424' },
      { name: 'VIP 2', price: 15000, color: '#FFB424' },
      { name: 'VIP 3', price: 12000, color: '#D2D3D3' },
      { name: 'VIP 4', price: 15000, color: '#FFB424' },
      { name: 'VIP 5', price: 12000, color: '#D2D3D3' },
      { name: 'VIP 6', price: 15000, color: '#FFB424' },
      { name: 'VIP 7', price: 15000, color: '#FFB424' },
      { name: 'VIP 8', price: 15000, color: '#FFB424' },
      { name: 'VIP 9', price: 15000, color: '#FFB424' },
      { name: 'VIP 10', price: 15000, color: '#FFB424' },
      { name: 'VIP 11', price: 15000, color: '#FFB424' },
      { name: 'VIP 12', price: 15000, color: '#FFB424' },
      { name: 'VIP 13', price: 12000, color: '#D2D3D3' },
      { name: 'VIP 14', price: 15000, color: '#FFB424' },
      
      // Зоны балкона
      { name: '201', price: 8000, color: '#4ED784' },
      { name: '202', price: 7000, color: '#A49EFD' },
      { name: '203', price: 7000, color: '#D06EE9' },
      { name: '204', price: 7000, color: '#D06EE9' },
      { name: '205', price: 6000, color: '#F1F298' },
      { name: '206', price: 6000, color: '#FF6877' },
      { name: '207', price: 6000, color: '#FF6877' },
      { name: '208', price: 6000, color: '#FF6877' },
      { name: '209', price: 6000, color: '#F1F298' },
      { name: '210', price: 7000, color: '#D06EE9' },
      { name: '211', price: 7000, color: '#D06EE9' },
      { name: '212', price: 7000, color: '#A49EFD' },
      { name: '213', price: 8000, color: '#4ED784' },
      
      // General Access
      { name: 'GENERAL ACCESS', price: 5000, color: '#5BD6D3' }
    ]

    const { data: insertedZones, error: zonesError } = await supabase
      .from('zones')
      .insert(zones.map(zone => ({ ...zone, event_id: eventId })))
      .select('id, name')

    if (zonesError) {
      console.error('Ошибка добавления зон:', zonesError)
      return
    }

    console.log('Добавлено зон:', insertedZones.length)

    // Добавляем места для каждой зоны
    console.log('Добавление мест...')
    const seats = []

    for (const zone of insertedZones) {
      let totalSeats, xCoord, yCoord

      // Определяем параметры в зависимости от зоны
      if (zone.name.startsWith('VIP')) {
        totalSeats = 20
        xCoord = 23.1
        yCoord = 128.0 + (parseInt(zone.name.split(' ')[1]) - 1) * 130
      } else if (zone.name === 'GENERAL ACCESS') {
        totalSeats = 200
        xCoord = 364.25
        yCoord = 300.15
      } else {
        // Зоны балкона
        totalSeats = 30
        const zoneNum = parseInt(zone.name)
        if (zoneNum >= 201 && zoneNum <= 206) {
          xCoord = 102.15
          yCoord = 115.85 + (zoneNum - 201) * 108
        } else if (zoneNum === 207) {
          xCoord = 364.3
          yCoord = 655.85
        } else if (zoneNum === 208) {
          xCoord = 492.4
          yCoord = 655.85
        } else if (zoneNum >= 209 && zoneNum <= 213) {
          xCoord = 620.5
          yCoord = 655.85 - (zoneNum - 209) * 108
        }
      }

      // Создаем места для зоны
      for (let row = 1; row <= Math.ceil(totalSeats / 10); row++) {
        for (let seat = 1; seat <= Math.min(10, totalSeats - (row - 1) * 10); seat++) {
          seats.push({
            zone_id: zone.id,
            row_number: row,
            seat_number: seat,
            x_coordinate: xCoord + (seat - 1) * 8.0,
            y_coordinate: yCoord + (row - 1) * 8.0,
            status: 'available'
          })
        }
      }
    }

    // Добавляем места батчами по 100
    const batchSize = 100
    for (let i = 0; i < seats.length; i += batchSize) {
      const batch = seats.slice(i, i + batchSize)
      const { error: seatsError } = await supabase
        .from('seats')
        .insert(batch)

      if (seatsError) {
        console.error('Ошибка добавления мест:', seatsError)
        return
      }

      console.log(`Добавлено мест: ${Math.min(i + batchSize, seats.length)}/${seats.length}`)
    }

    console.log('Настройка данных завершена успешно!')

    // Проверяем результат
    const { data: result, error: resultError } = await supabase
      .from('zones')
      .select(`
        name,
        price,
        color,
        seats (id, status)
      `)
      .eq('event_id', eventId)

    if (resultError) {
      console.error('Ошибка получения результата:', resultError)
      return
    }

    console.log('\nРезультат:')
    result.forEach(zone => {
      const totalSeats = zone.seats.length
      const availableSeats = zone.seats.filter(s => s.status === 'available').length
      console.log(`${zone.name}: ${availableSeats}/${totalSeats} мест доступно, ${zone.price}₽`)
    })

  } catch (error) {
    console.error('Ошибка:', error)
  }
}

setupVenueData() 