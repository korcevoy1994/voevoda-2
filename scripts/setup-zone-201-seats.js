require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js')

// --- НАЧАЛО ВАШИХ ДАННЫХ ---

// Укажите точное имя зоны, для которой вы добавляете места
const TARGET_ZONE_NAME = '201'; 

// Вставьте сюда ваши данные из Figma
// Для каждого места укажите:
// - row_name: Название ряда (например, 'A', 'B', 'K')
// - seat_number: Номер места в этом ряду
// - x_coordinate: Координата X из Figma
// - y_coordinate: Координата Y из Figma
const seatData = [
  { row_name: 'K', seat_number: 1, x_coordinate: 56, y_coordinate: 56 },
  { row_name: 'K', seat_number: 2, x_coordinate: 104, y_coordinate: 56 },
  { row_name: 'K', seat_number: 3, x_coordinate: 152.01, y_coordinate: 56 },
  { row_name: 'K', seat_number: 4, x_coordinate: 200.01, y_coordinate: 56 },
  { row_name: 'K', seat_number: 5, x_coordinate: 248.15, y_coordinate: 56 },
  { row_name: 'K', seat_number: 6, x_coordinate: 296.16, y_coordinate: 56 },
  { row_name: 'K', seat_number: 7, x_coordinate: 344.16, y_coordinate: 56 },
  { row_name: 'K', seat_number: 8, x_coordinate: 392.16, y_coordinate: 56 },
  { row_name: 'K', seat_number: 9, x_coordinate: 440.17, y_coordinate: 56 },
  { row_name: 'K', seat_number: 10, x_coordinate: 488.17, y_coordinate: 56 },
  { row_name: 'K', seat_number: 11, x_coordinate: 536.17, y_coordinate: 56 },
  { row_name: 'K', seat_number: 12, x_coordinate: 584.17, y_coordinate: 56 },
  { row_name: 'K', seat_number: 13, x_coordinate: 632.17, y_coordinate: 56 },
  { row_name: 'K', seat_number: 14, x_coordinate: 680.19, y_coordinate: 56 },
  { row_name: 'J', seat_number: 1, x_coordinate: 56, y_coordinate: 104 },
  { row_name: 'J', seat_number: 2, x_coordinate: 104, y_coordinate: 104 },
  { row_name: 'J', seat_number: 3, x_coordinate: 152.01, y_coordinate: 104 },
  { row_name: 'J', seat_number: 4, x_coordinate: 200.01, y_coordinate: 104 },
  { row_name: 'J', seat_number: 5, x_coordinate: 248.15, y_coordinate: 104 },
  { row_name: 'J', seat_number: 6, x_coordinate: 296.16, y_coordinate: 104 },
  { row_name: 'J', seat_number: 7, x_coordinate: 344.16, y_coordinate: 104 },
  { row_name: 'J', seat_number: 8, x_coordinate: 392.16, y_coordinate: 104 },
  { row_name: 'J', seat_number: 9, x_coordinate: 440.17, y_coordinate: 104 },
  { row_name: 'J', seat_number: 10, x_coordinate: 488.17, y_coordinate: 104 },
  { row_name: 'J', seat_number: 11, x_coordinate: 536.17, y_coordinate: 104 },
  { row_name: 'J', seat_number: 12, x_coordinate: 584.17, y_coordinate: 104 },
  { row_name: 'J', seat_number: 13, x_coordinate: 632.17, y_coordinate: 104 },
  { row_name: 'J', seat_number: 14, x_coordinate: 680.19, y_coordinate: 104 },
  { row_name: 'I', seat_number: 1, x_coordinate: 56, y_coordinate: 152 },
  { row_name: 'I', seat_number: 2, x_coordinate: 104, y_coordinate: 152 },
  { row_name: 'I', seat_number: 3, x_coordinate: 152.01, y_coordinate: 152 },
  { row_name: 'I', seat_number: 4, x_coordinate: 200.01, y_coordinate: 152 },
  { row_name: 'I', seat_number: 5, x_coordinate: 248.15, y_coordinate: 152 },
  { row_name: 'I', seat_number: 6, x_coordinate: 296.16, y_coordinate: 152 },
  { row_name: 'I', seat_number: 7, x_coordinate: 344.16, y_coordinate: 152 },
  { row_name: 'I', seat_number: 8, x_coordinate: 392.16, y_coordinate: 152 },
  { row_name: 'I', seat_number: 9, x_coordinate: 440.17, y_coordinate: 152 },
  { row_name: 'I', seat_number: 10, x_coordinate: 488.17, y_coordinate: 152 },
  { row_name: 'I', seat_number: 11, x_coordinate: 536.17, y_coordinate: 152 },
  { row_name: 'I', seat_number: 12, x_coordinate: 584.17, y_coordinate: 152 },
  { row_name: 'I', seat_number: 13, x_coordinate: 632.17, y_coordinate: 152 },
  { row_name: 'I', seat_number: 14, x_coordinate: 680.19, y_coordinate: 152 },
  { row_name: 'H', seat_number: 1, x_coordinate: 56, y_coordinate: 200 },
  { row_name: 'H', seat_number: 2, x_coordinate: 104, y_coordinate: 200 },
  { row_name: 'H', seat_number: 3, x_coordinate: 152.01, y_coordinate: 200 },
  { row_name: 'H', seat_number: 4, x_coordinate: 200.01, y_coordinate: 200 },
  { row_name: 'H', seat_number: 5, x_coordinate: 248.15, y_coordinate: 200 },
  { row_name: 'H', seat_number: 6, x_coordinate: 296.16, y_coordinate: 200 },
  { row_name: 'H', seat_number: 7, x_coordinate: 344.16, y_coordinate: 200 },
  { row_name: 'H', seat_number: 8, x_coordinate: 392.16, y_coordinate: 200 },
  { row_name: 'H', seat_number: 9, x_coordinate: 440.17, y_coordinate: 200 },
  { row_name: 'H', seat_number: 10, x_coordinate: 488.17, y_coordinate: 200 },
  { row_name: 'H', seat_number: 11, x_coordinate: 536.17, y_coordinate: 200 },
  { row_name: 'H', seat_number: 12, x_coordinate: 584.17, y_coordinate: 200 },
  { row_name: 'H', seat_number: 13, x_coordinate: 632.17, y_coordinate: 200 },
  { row_name: 'H', seat_number: 14, x_coordinate: 680.19, y_coordinate: 200 },
  { row_name: 'G', seat_number: 1, x_coordinate: 56, y_coordinate: 248 },
  { row_name: 'G', seat_number: 2, x_coordinate: 104, y_coordinate: 248 },
  { row_name: 'G', seat_number: 3, x_coordinate: 152.01, y_coordinate: 248 },
  { row_name: 'G', seat_number: 4, x_coordinate: 200.01, y_coordinate: 248 },
  { row_name: 'G', seat_number: 5, x_coordinate: 248.15, y_coordinate: 248 },
  { row_name: 'G', seat_number: 6, x_coordinate: 296.16, y_coordinate: 248 },
  { row_name: 'G', seat_number: 7, x_coordinate: 344.16, y_coordinate: 248 },
  { row_name: 'G', seat_number: 8, x_coordinate: 392.16, y_coordinate: 248 },
  { row_name: 'G', seat_number: 9, x_coordinate: 440.17, y_coordinate: 248 },
  { row_name: 'G', seat_number: 10, x_coordinate: 488.17, y_coordinate: 248 },
  { row_name: 'G', seat_number: 11, x_coordinate: 536.17, y_coordinate: 248 },
  { row_name: 'G', seat_number: 12, x_coordinate: 584.17, y_coordinate: 248 },
  { row_name: 'G', seat_number: 13, x_coordinate: 632.17, y_coordinate: 248 },
  { row_name: 'G', seat_number: 14, x_coordinate: 680.19, y_coordinate: 248 },
  { row_name: 'F', seat_number: 1, x_coordinate: 56, y_coordinate: 296 },
  { row_name: 'F', seat_number: 2, x_coordinate: 104, y_coordinate: 296 },
  { row_name: 'F', seat_number: 3, x_coordinate: 152.01, y_coordinate: 296 },
  { row_name: 'F', seat_number: 4, x_coordinate: 200.01, y_coordinate: 296 },
  { row_name: 'F', seat_number: 5, x_coordinate: 248.15, y_coordinate: 296 },
  { row_name: 'F', seat_number: 6, x_coordinate: 296.16, y_coordinate: 296 },
  { row_name: 'F', seat_number: 7, x_coordinate: 344.16, y_coordinate: 296 },
  { row_name: 'F', seat_number: 8, x_coordinate: 392.16, y_coordinate: 296 },
  { row_name: 'F', seat_number: 9, x_coordinate: 440.17, y_coordinate: 296 },
  { row_name: 'F', seat_number: 10, x_coordinate: 488.17, y_coordinate: 296 },
  { row_name: 'F', seat_number: 11, x_coordinate: 536.17, y_coordinate: 296 },
  { row_name: 'F', seat_number: 12, x_coordinate: 584.17, y_coordinate: 296 },
  { row_name: 'E', seat_number: 1, x_coordinate: 56, y_coordinate: 344 },
  { row_name: 'E', seat_number: 2, x_coordinate: 104, y_coordinate: 344 },
  { row_name: 'E', seat_number: 3, x_coordinate: 152.01, y_coordinate: 344 },
  { row_name: 'E', seat_number: 4, x_coordinate: 200.01, y_coordinate: 344 },
  { row_name: 'E', seat_number: 5, x_coordinate: 248.15, y_coordinate: 344 },
  { row_name: 'E', seat_number: 6, x_coordinate: 296.16, y_coordinate: 344 },
  { row_name: 'E', seat_number: 7, x_coordinate: 344.16, y_coordinate: 344 },
  { row_name: 'E', seat_number: 8, x_coordinate: 392.16, y_coordinate: 344 },
  { row_name: 'E', seat_number: 9, x_coordinate: 440.17, y_coordinate: 344 },
  { row_name: 'E', seat_number: 10, x_coordinate: 488.17, y_coordinate: 344 },
  { row_name: 'E', seat_number: 11, x_coordinate: 536.17, y_coordinate: 344 },
  { row_name: 'E', seat_number: 12, x_coordinate: 584.17, y_coordinate: 344 },
  { row_name: 'D', seat_number: 1, x_coordinate: 56, y_coordinate: 392 },
  { row_name: 'D', seat_number: 2, x_coordinate: 104, y_coordinate: 392 },
  { row_name: 'D', seat_number: 3, x_coordinate: 152.01, y_coordinate: 392 },
  { row_name: 'D', seat_number: 4, x_coordinate: 200.01, y_coordinate: 392 },
  { row_name: 'D', seat_number: 5, x_coordinate: 248.15, y_coordinate: 392 },
  { row_name: 'D', seat_number: 6, x_coordinate: 296.16, y_coordinate: 392 },
  { row_name: 'D', seat_number: 7, x_coordinate: 344.16, y_coordinate: 392 },
  { row_name: 'D', seat_number: 8, x_coordinate: 392.16, y_coordinate: 392 },
  { row_name: 'D', seat_number: 9, x_coordinate: 440.17, y_coordinate: 392 },
  { row_name: 'D', seat_number: 10, x_coordinate: 488.17, y_coordinate: 392 },
  { row_name: 'D', seat_number: 11, x_coordinate: 536.17, y_coordinate: 392 },
  { row_name: 'D', seat_number: 12, x_coordinate: 584.17, y_coordinate: 392 },
  { row_name: 'C', seat_number: 1, x_coordinate: 56, y_coordinate: 440 },
  { row_name: 'C', seat_number: 2, x_coordinate: 104, y_coordinate: 440 },
  { row_name: 'C', seat_number: 3, x_coordinate: 152.01, y_coordinate: 440 },
  { row_name: 'C', seat_number: 4, x_coordinate: 200.01, y_coordinate: 440 },
  { row_name: 'C', seat_number: 5, x_coordinate: 248.15, y_coordinate: 440 },
  { row_name: 'C', seat_number: 6, x_coordinate: 296.16, y_coordinate: 440 },
  { row_name: 'C', seat_number: 7, x_coordinate: 344.16, y_coordinate: 440 },
  { row_name: 'C', seat_number: 8, x_coordinate: 392.16, y_coordinate: 440 },
  { row_name: 'C', seat_number: 9, x_coordinate: 440.17, y_coordinate: 440 },
  { row_name: 'C', seat_number: 10, x_coordinate: 488.17, y_coordinate: 440 },
  { row_name: 'C', seat_number: 11, x_coordinate: 536.17, y_coordinate: 440 },
  { row_name: 'C', seat_number: 12, x_coordinate: 584.17, y_coordinate: 440 },
  { row_name: 'B', seat_number: 1, x_coordinate: 488.17, y_coordinate: 487.78 },
  { row_name: 'B', seat_number: 2, x_coordinate: 536.17, y_coordinate: 487.78 },
  { row_name: 'B', seat_number: 3, x_coordinate: 584.17, y_coordinate: 487.78 },
  { row_name: 'A', seat_number: 1, x_coordinate: 488.17, y_coordinate: 536.17 },
  { row_name: 'A', seat_number: 2, x_coordinate: 536.17, y_coordinate: 536.17 },
  { row_name: 'A', seat_number: 3, x_coordinate: 584.17, y_coordinate: 536.17 },
];

// --- КОНЕЦ ВАШИХ ДАННЫХ ---

async function populateSeats() {
  if (seatData.length === 0) {
    console.log('Массив `seatData` пуст. Нечего добавлять. Пожалуйста, заполните его данными из Figma.');
    return;
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log(`Настройка мест для зоны "${TARGET_ZONE_NAME}"...`);

    // 1. Найти id для целевой зоны
    const { data: zoneData, error: zoneError } = await supabase
      .from('zones')
      .select('id')
      .eq('name', TARGET_ZONE_NAME)
      .single();

    if (zoneError || !zoneData) {
      console.error(`Ошибка: Не удалось найти зону с именем "${TARGET_ZONE_NAME}".`, zoneError);
      return;
    }
    const zoneId = zoneData.id;
    console.log(`Найден id зоны '${TARGET_ZONE_NAME}': ${zoneId}`);

    // 2. Удалить существующие места для этой зоны, чтобы избежать дубликатов
    console.log(`Удаление существующих мест для zone_id: ${zoneId}...`);
    const { error: deleteError } = await supabase
      .from('seats')
      .delete()
      .eq('zone_id', zoneId);

    if (deleteError) {
      console.error('Ошибка при удалении существующих мест:', deleteError);
      return;
    }

    // 3. Подготовить и вставить новые места
    const seatsToInsert = seatData.map(seat => ({
      zone_id: zoneId,
      row_number: seat.row_name.charCodeAt(0) - 64, // 'A' -> 1, 'B' -> 2 etc.
      seat_number: seat.seat_number,
      x_coordinate: seat.x_coordinate,
      y_coordinate: seat.y_coordinate,
      status: 'available'
    }));
    
    console.log(`Создание ${seatsToInsert.length} мест для зоны ${TARGET_ZONE_NAME}...`);
    const { data, error } = await supabase.from('seats').insert(seatsToInsert).select();

    if (error) {
      throw error;
    }

    console.log(`Места для зоны ${TARGET_ZONE_NAME} успешно созданы! Всего создано: ${data.length}`);

    // 4. Проверить результат
    const { count, error: countError } = await supabase
        .from('seats')
        .select('*', { count: 'exact', head: true })
        .eq('zone_id', zoneId);

    if(countError) {
        console.error('Ошибка при проверке количества мест:', countError);
        return;
    }

    console.log(`\n--- Проверка ---`);
    console.log(`Всего мест в базе для зоны ${TARGET_ZONE_NAME} (${zoneId}): ${count}`);
    console.log(`Ожидалось: ${seatsToInsert.length}`);
    if (count === seatsToInsert.length) {
        console.log('Проверка прошла успешно!');
    } else {
        console.error('ОШИБКА: Количество мест в базе не соответствует ожидаемому!');
    }

  } catch (error) {
    console.error('Произошла непредвиденная ошибка:', error);
  }
}

populateSeats(); 