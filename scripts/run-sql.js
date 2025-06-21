const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Загружаем переменные окружения
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runSQL() {
  try {
    // Этап 1: Создание или обновление функции exec_sql
    console.log('Этап 1: Создание/обновление функции exec_sql...')
    const execSqlFunctionContent = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql;
    `;
    // Для создания функции мы не можем использовать rpc('exec_sql'), так как ее еще нет.
    // Вместо этого мы можем использовать стандартный API Supabase для выполнения запросов, 
    // но это сложнее. Проще всего создать ее один раз через SQL Editor в Supabase.
    // Однако, попробуем через rpc('sql') - это может не сработать.
    // Правильный способ - создать эту функцию один раз вручную в дашборде Supabase.
    // Для этого воркфлоу, я предполагаю, что вы можете создать ее вручную.
    // Я оставлю код для создания второй функции.
    
    console.log('Предполагается, что функция exec_sql уже существует или создана вручную.');
    
    // Этап 2: Создание функции get_order_details
    console.log('Этап 2: Создание функции get_order_details...')
    const orderDetailsFunctionContent = fs.readFileSync('./scripts/10-add-order-details-function.sql', 'utf8')
    const { error } = await supabase.rpc('exec_sql', { sql_query: orderDetailsFunctionContent })
    
    if (error) {
      // Если ошибка в том, что exec_sql не найдена, дадим инструкцию
      if (error.message.includes('function exec_sql')) {
          console.error('\x1b[31m%s\x1b[0m', 'Критическая ошибка: Вспомогательная функция `exec_sql` не найдена.');
          console.error('Пожалуйста, создайте ее вручную в вашем Supabase проекте (SQL Editor):');
          console.error('\x1b[33m%s\x1b[0m', execSqlFunctionContent);
          return;
      }
      console.error('Ошибка выполнения SQL для get_order_details:', error)
      return
    }
    
    console.log('SQL для создания get_order_details выполнен успешно!')
  } catch (error) {
    console.error('Ошибка:', error)
  }
}

runSQL() 