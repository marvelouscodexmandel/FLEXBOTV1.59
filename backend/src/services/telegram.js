const api=()=>{if(!process.env.TELEGRAM_BOT_TOKEN)throw new Error('Telegram bot token is not configured');return 'https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN};
export async function telegramCall(method,body){const r=await fetch(api()+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.description||'Telegram API error');return d.result}
export async function sendTelegram(chat_id,text){return telegramCall('sendMessage',{chat_id,text})}
