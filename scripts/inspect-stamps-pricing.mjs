import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: g } = await sb.from('product_groups').select('id,name').eq('slug','self-inking-stamps').single()
console.log('Product group:', g.name, g.id)

const { data: rules } = await sb.from('pricing_rules').select('*').eq('product_group_id', g.id).order('display_order')
console.log('\nCurrent pricing rules:')
rules.forEach(r => console.log(`  [${r.rule_type}] price=${r.price_value} active=${r.is_active} conditions=${JSON.stringify(r.conditions)}`))

const { data: templates } = await sb.from('product_templates').select('id,name,template_parameters(param_key,options)').eq('product_group_id', g.id)
console.log('\nTemplates & parameters:')
templates.forEach(t => {
  console.log(`  Template: ${t.name}`)
  t.template_parameters.forEach(p => console.log(`    param_key="${p.param_key}" options=${JSON.stringify(p.options)}`))
})
