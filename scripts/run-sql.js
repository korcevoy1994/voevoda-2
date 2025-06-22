const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Error: Missing Supabase URL or service role key. Please check your .env.local file.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// This helper function MUST exist in your Supabase SQL Editor.
// See the instructions in the README or previous messages.
const HELPER_FUNCTION_NAME = 'exec_sql'
const CHUNK_SEPARATOR = '-- SPLIT --'

async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}...`)
    const sqlContent = fs.readFileSync(filePath, 'utf8')
    const sqlChunks = sqlContent.split(CHUNK_SEPARATOR)

    console.log(`Found ${sqlChunks.length} chunk(s) to execute.`)

    for (let i = 0; i < sqlChunks.length; i++) {
      const chunk = sqlChunks[i].trim()
      if (chunk.length === 0) continue

      console.log(`Executing chunk ${i + 1}/${sqlChunks.length}...`)
      const { error } = await supabase.rpc(HELPER_FUNCTION_NAME, {
        sql_query: chunk,
      })

      if (error) {
        console.error(
          `\x1b[31mError executing chunk ${i + 1}:\x1b[0m`,
          error.message
        )
        process.exit(1)
      }
    }

    console.log(
      `\x1b[32mSuccessfully executed all chunks from ${filePath}\x1b[0m`
    )
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Error: File not found at ${filePath}`)
    } else {
      console.error('An unexpected error occurred:', err)
    }
    process.exit(1)
  }
}

const filePath = process.argv[2]
if (!filePath) {
  console.error('Error: Please provide the path to the SQL file to execute.')
  process.exit(1)
}

runSqlFile(path.resolve(process.cwd(), filePath)) 