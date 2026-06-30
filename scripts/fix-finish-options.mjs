import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load env vars manually
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await sb
  .from('template_parameters')
  .update({ options: ['Gloss', 'Matte'] })
  .eq('param_key', 'finish')
  .filter('options', 'cs', '["Satin"]')
  .select('id, param_key, options')

if (error) {
  console.error('Error:', error)
  process.exit(1)
}
console.log(`Updated ${data?.length ?? 0} row(s):`)
console.log(JSON.stringify(data, null, 2))
