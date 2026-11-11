#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
mkdir -p tests/api/reports
node --check tests/api/run.mjs
node tests/api/run.mjs --self-test
if node tests/api/run.mjs --intentional-failure > tests/api/reports/gate-proof.log 2>&1; then
  echo 'ERROR: the gate accepted an intentional failure'; exit 1
fi
cd spring-petclinic-rest
sh mvnw -q -DskipTests package > "$root/tests/api/reports/build.log" 2>&1
jar=$(find target -maxdepth 1 -name '*.jar' -print -quit)
test -n "$jar"
# Separate port and fresh in-memory data; leave the existing local service alone.
java -jar "$jar" --server.port=19966 --spring.profiles.active=h2,spring-data-jpa > "$root/tests/api/reports/api.log" 2>&1 &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT
export API_URL=http://127.0.0.1:19966/petclinic
node --input-type=module - <<'NODE'
const deadline=Date.now()+90000;
let ready=false;
while(Date.now()<deadline){
  try{const r=await fetch(process.env.API_URL+'/actuator/health',{signal:AbortSignal.timeout(2000)});if(r.ok&&(await r.json()).status==='UP'){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
}
if(!ready){console.error('API did not become healthy; inspect api.log');process.exit(1);}
NODE
cd "$root"
node tests/api/run.mjs
