import jwt from 'jsonwebtoken';
export function requireAuth(req,res,next){const token=req.cookies?.flexbot_session;if(!token)return res.status(401).json({error:'Authentication required'});try{req.user=jwt.verify(token,process.env.SESSION_SECRET);next()}catch{return res.status(401).json({error:'Session expired'})}}
export function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'Administrator access required'});next()}
