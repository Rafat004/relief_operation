const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: edges } = await supabase.from('edges').select('*');
  const { data: nodes } = await supabase.from('nodes').select('id, name');
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n.name]));

  console.log('Nodes:');
  console.log(nodeMap);
  console.log('\nEdges:');
  edges.forEach(e => {
    console.log(`${e.id}: ${nodeMap[e.node_a]} (${e.node_a}) <-> ${nodeMap[e.node_b]} (${e.node_b}) [Passable: ${e.passable}] [Time: ${e.minutes}]`);
  });
}
run();
