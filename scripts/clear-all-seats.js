require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

async function clearAllSeats() {
  if (process.env.NODE_ENV !== 'development' && process.argv[2] !== '--force') {
    console.error('ОСТОРОЖНО: Этот скрипт удалит ВСЕ места из базы данных.');
    console.error('Это действие необратимо.');
    console.error('Для запуска в производственной среде используйте флаг --force.');
    console.error('Пример: node scripts/clear-all-seats.js --force');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Удаление всех мест из таблицы "seats"...');

    const { error: deleteError } = await supabase
      .from('seats')
      .delete()
      .gt('x_coordinate', -1); // Уловка для удаления всех строк, так как delete() без фильтров не работает

    if (deleteError) {
      throw deleteError;
    }
    
    console.log('Все места были успешно удалены.');

    const { count, error: countError } = await supabase
        .from('seats')
        .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;

    console.log(`Проверка: в таблице "seats" теперь ${count} записей.`);

  } catch (error) {
    console.error('Произошла ошибка при удалении мест:', error.message);
  }
}

clearAllSeats(); 