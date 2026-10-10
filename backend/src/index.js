import 'dotenv/config';import express from 'express';import cookieParser from 'cookie-parser';import bcrypt from 'bcryptjs';import {pool,initDb} from './db.js';import health from './routes/health.js';import auth from './routes/auth.js';import telegram from './routes/telegram.js';import webhook from './routes/webhook.js';
const app=express();app.set('trust proxy',1);app.use(express.json({limit:'1mb',verify:(req,_res,buf)=>{req.rawBody=Buffer.from(buf)}}));app.use(cookieParser());
app.use('/api/health',health);app.use('/api/auth',auth);app.use('/api/telegram',telegram);app.use('/webhooks',webhook);app.use('/webhooks',telegram);
app.get('/api/meta/status',(_req,res)=>res.json({configured:Boolean(process.env.WA_PHONE_NUMBER_ID&&process.env.WA_ACCESS_TOKEN),graphVersion:process.env.WA_GRAPH_VERSION||'v26.0'}));
app.get('/',(_req,res)=>res.json({service:'FlexBot API',ok:true,health:'/api/health'}));
const port=Number(process.env.PORT||3000);
await initDb();
if(process.env.NODE_ENV==='production'&&(!process.env.ADMIN_USERNAME||!process.env.ADMIN_PASSWORD_HASH||process.env.ADMIN_PASSWORD_HASH.startsWith('replace-')))throw new Error('Set ADMIN_USERNAME and a real bcrypt ADMIN_PASSWORD_HASH before production startup');
if(process.env.ADMIN_USERNAME&&process.env.ADMIN_PASSWORD_HASH&&!process.env.ADMIN_PASSWORD_HASH.startsWith('replace-')){const hash=process.env.ADMIN_PASSWORD_HASH;await pool.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,'admin') ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='admin'",[process.env.ADMIN_USERNAME,hash])}
setInterval(()=>pool.query("DELETE FROM webhook_events WHERE created_at < now() - interval '10 minutes'").catch(()=>{}),60000).unref();
app.listen(port,'0.0.0.0',()=>console.log('FlexBot API listening on '+port));
