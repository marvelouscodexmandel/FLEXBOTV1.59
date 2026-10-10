import { Router } from 'express';
const r=Router();
r.get('/',(_req,res)=>res.json({ok:true,service:'FlexBot API',version:'1.8.1',time:new Date().toISOString()}));
export default r;
