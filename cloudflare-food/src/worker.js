const ORIGINS = new Set(["https://zhitproshche.ru", "https://www.zhitproshche.ru"]);
const FIELDS = ["name","description","servings","cooking_time","have","missing","substitutions","ingredients","steps","leftovers"];
const arr = () => ({type:"array",items:{type:"string"}});
const schema = {type:"object",additionalProperties:false,required:["suggestions"],properties:{
  suggestions:{type:"array",minItems:3,maxItems:3,items:{type:"object",additionalProperties:false,required:FIELDS,properties:{
    name:{type:"string"},description:{type:"string"},servings:{type:"integer"},cooking_time:{type:"integer"},
    have:arr(),missing:arr(),substitutions:arr(),ingredients:arr(),steps:arr(),leftovers:arr()
  }}}
}};
function response(data,status,origin) {
  return new Response(JSON.stringify(data),{status,headers:{
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin",
    "Access-Control-Allow-Origin":origin||"https://zhitproshche.ru",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Access-Control-Allow-Headers":"content-type"
  }});
}
const clean=(v,max=100)=>String(v??"").trim().slice(0,max);
const list=(v,max)=>Array.isArray(v)?v.slice(0,max).map(x=>clean(x,80)).filter(Boolean):[];
async function digest(v){const x=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(x)].map(b=>b.toString(16).padStart(2,"0")).join("");}
const instructions = `Ты — помощник «ЖИТЬ ПРОЩЕ». Предложи ровно три разных реалистичных домашних блюда на русском языке.
Строго учитывай исходные продукты, количество порций, максимум времени и запрет ингредиентов.
Не надо использовать все продукты. В have перечисляй только действительно использованные исходные продукты.
В missing — только то, что необходимо докупить; воду, соль и обычное растительное масло считай базовыми.
В ingredients указывай практичные количества в г, мл или шт. В steps дай 5–7 коротких шагов.
В leftovers помещай только оставшиеся продукты из исходного списка, не включая запрещённые.
Учитывай состояние ингредиентов: сухой продукт не равен готовому. Сроки приготовления должны быть реалистичными.
Не допускай небезопасных способов приготовления. Возвращай только JSON по схеме.`;
export default {
 async fetch(req,env){
  const origin=req.headers.get("Origin");
  if(origin && !ORIGINS.has(origin))return response({error:"origin_not_allowed"},403,"https://zhitproshche.ru");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin||"https://zhitproshche.ru","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"content-type","Vary":"Origin"}});
  if(req.method!=="POST")return response({error:"method_not_allowed"},405,origin);
  if(!env.OPENAI_API_KEY || !env.RATE_LIMIT)return response({error:"service_not_configured"},503,origin);
  if(Number(req.headers.get("content-length")||0)>15000)return response({error:"invalid_input"},413,origin);
  let body;
  try {const text=await req.text();if(text.length>15000)throw Error("too large");body=JSON.parse(text);}
  catch{return response({error:"invalid_input"},400,origin);}
  const ingredients=list(body.ingredients,40),excluded=list(body.excluded,20);
  const people=Number(body.people),time=body.max_time==null?null:Number(body.max_time);
  if(!ingredients.length||!Number.isInteger(people)||people<1||people>20||time!==null&&(!Number.isInteger(time)||time<5||time>120))
   return response({error:"invalid_input"},400,origin);
  const anonymous=clean(body.anonymous_id,120);
  if(!/^zp_[a-f0-9-]{20,50}$/i.test(anonymous))return response({error:"invalid_input"},400,origin);
  const clientIp=req.headers.get("CF-Connecting-IP")||"unknown";
  const key="food:"+await digest(anonymous+"|"+clientIp);
  const recent=JSON.parse(await env.RATE_LIMIT.get(key)||"[]").filter(n=>Number.isFinite(n)&&n>Date.now()-86400000);
  if(recent.length>=5)return response({error:"daily_limit"},429,origin);
  // This low-volume limiter uses KV; KV is eventually consistent, so simultaneous requests may race.
  await env.RATE_LIMIT.put(key,JSON.stringify([...recent,Date.now()]),{expirationTtl:86400});
  const input=`Дома: ${ingredients.join(", ")}. Порций: ${people}. Время: ${time===null?"без ограничения":time+" минут"}. Исключить: ${excluded.join(", ")||"ничего"}.`;
  const control=new AbortController();
  const timer=setTimeout(()=>control.abort(),35000);
  let remote;
  try{
   remote=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-4.1-mini",instructions,input,store:false,max_output_tokens:2600,text:{format:{type:"json_schema",name:"food_suggestions",strict:true,schema}}}),signal:control.signal});
  }catch(e){return response({error:e?.name==="AbortError"?"upstream_timeout":"upstream_unavailable"},503,origin);}
  finally{clearTimeout(timer);}
  if(!remote.ok){console.error("OpenAI upstream HTTP",remote.status);return response({error:"generation_failed"},502,origin);}
  let result;
  try{const raw=await remote.json();const text=raw.output_text||raw.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;result=JSON.parse(text);
    if(!Array.isArray(result.suggestions)||result.suggestions.length!==3)throw Error("unexpected response");
  }catch{return response({error:"generation_failed"},502,origin);}
  return response(result,200,origin);
 }
};
