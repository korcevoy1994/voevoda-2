const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateOrderStatuses() {
  try {
    console.log('🔄 Обновление статусов заказов...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '11-update-order-statuses.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Выполняю SQL:', statement.substring(0, 100) + '...');
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.error('❌ Ошибка:', error);
        } else {
          console.log('✅ Успешно выполнено');
        }
      }
    }
    
    console.log('🎉 Обновление статусов заказов завершено!');
    
  } catch (error) {
    console.error('💥 Ошибка при обновлении:', error);
  }
}

updateOrderStatuses(); 