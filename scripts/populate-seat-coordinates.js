// scripts/populate-seat-coordinates.js

/*
 * =============================================================================
 * ВНИМАНИЕ: Этот скрипт обновляет вашу базу данных.
 * Сделайте бэкап перед запуском, если вы не уверены в своих действиях.
 * =============================================================================
 *
 * Инструкция:
 * 1. Установите зависимость: `npm install @supabase/supabase-js dotenv`
 * 2. Создайте файл `.env` в корне проекта, если его еще нет.
 * 3. Добавьте в `.env` ваши ключи Supabase:
 *    SUPABASE_URL=https://xxxxxxxx.supabase.co
 *    SUPABASE_SERVICE_KEY=ey...
 * 4. Настройте координаты: В объекте `zoneLayouts` ниже, определите расположение
 *    мест для каждой зоны. `x` и `y` - это координаты центра каждого места.
 *    Я предоставил пример для зоны '201'. Вам нужно будет сделать то же самое
 *    для остальных зон (202-213).
 * 5. Запустите скрипт: `node scripts/populate-seat-coordinates.js`
 * 6. После успешного выполнения скрипта, удалите его или закомментируйте,
 *    чтобы случайно не запустить снова.
 */

require("dotenv").config()
const { createClient } = require("@supabase/supabase-js")

// Конфигурация Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// НАСТРОЙКА КООРДИНАТ МЕСТ
// =============================================================================
// Определите здесь расположение мест для каждой зоны.
// `zoneId` должен совпадать с `id` в вашей таблице `zones`.
// Для каждого места `row` и `seat` должны совпадать с данными в таблице `seats`.
const zoneLayouts = {
  // --- ПРИМЕР ДЛЯ ЗОНЫ 201 ---
  // Допустим, в зоне 201 есть 2 ряда по 5 мест.
  // Вы должны настроить эти координаты под вашу реальную схему.
  "201": [
    // Ряд 1
    { row: 1, seat: 1, x: 30, y: 30 },
    { row: 1, seat: 2, x: 50, y: 30 },
    { row: 1, seat: 3, x: 70, y: 30 },
    { row: 1, seat: 4, x: 90, y: 30 },
    { row: 1, seat: 5, x: 110, y: 30 },
    // Ряд 2
    { row: 2, seat: 1, x: 30, y: 50 },
    { row: 2, seat: 2, x: 50, y: 50 },
    { row: 2, seat: 3, x: 70, y: 50 },
    { row: 2, seat: 4, x: 90, y: 50 },
    { row: 2, seat: 5, x: 110, y: 50 },
  ],

  // --- ДОБАВЬТЕ ЗДЕСЬ ДАННЫЕ ДЛЯ ДРУГИХ ЗОН ---
  "202": [
    // { row: 1, seat: 1, x: 30, y: 30 },
  ],
  "203": [],
  // ... и так далее для всех зон 204-213
};

// =============================================================================
// ЛОГИКА СКРИПТА (не трогать)
// =============================================================================

async function updateSeatCoordinates() {
  console.log("🚀 Начинаем обновление координат мест...")

  for (const zoneId in zoneLayouts) {
    const seatsToUpdate = zoneLayouts[zoneId]
    if (seatsToUpdate.length === 0) {
      console.log(`🟡 Зона ${zoneId}: нет данных для обновления, пропускаем.`);
      continue
    }

    console.log(`\n🔄 Обновляем зону ${zoneId}...`);

    // Получаем ID всех мест для данной зоны, чтобы убедиться, что они существуют
    const { data: existingSeats, error: fetchError } = await supabase
      .from("seats")
      .select("id, row_number, seat_number")
      .eq("zone_id", zoneId)

    if (fetchError) {
      console.error(`❌ Ошибка при получении мест для зоны ${zoneId}:`, fetchError.message)
      continue
    }
    
    const updates = []
    for (const seatLayout of seatsToUpdate) {
        const matchingSeat = existingSeats.find(
            s => s.row_number === seatLayout.row && s.seat_number === seatLayout.seat
        )

        if(matchingSeat) {
            updates.push({
                id: matchingSeat.id,
                x_coordinate: seatLayout.x,
                y_coordinate: seatLayout.y,
            })
        } else {
            console.warn(`    ⚠️ ВНИМАНИЕ: Место (ряд ${seatLayout.row}, номер ${seatLayout.seat}) не найдено в БД для зоны ${zoneId}.`)
        }
    }

    if (updates.length > 0) {
        const { error: updateError } = await supabase.from("seats").upsert(updates)

        if (updateError) {
            console.error(`    ❌ Ошибка при обновлении ${updates.length} мест в зоне ${zoneId}:`, updateError.message);
        } else {
            console.log(`    ✅ Успешно обновлено ${updates.length} мест в зоне ${zoneId}.`)
        }
    } else {
        console.log(`    ℹ️ Для зоны ${zoneId} не было найдено совпадающих мест для обновления.`);
    }
  }
  
  console.log("\n🎉 Обновление координат завершено!");
}

updateSeatCoordinates().catch(console.error) 