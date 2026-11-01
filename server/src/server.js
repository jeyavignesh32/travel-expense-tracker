import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import { z } from 'zod';
import { pool, query } from './db.js';
import { auth, signToken } from './auth.js';
import { searchHotels } from './hotelProvider.js';

const app=express(), server=http.createServer(app);
const allowed=(process.env.CLIENT_ORIGIN||'http://localhost:5173').split(',');
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:allowed,credentials:true}));
app.use(express.json({limit:'1mb'}));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,max:30}));
const io=new Server(server,{cors:{origin:allowed,methods:['GET','POST']}});
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const tripAccess=async (tripId,userId)=> (await query('SELECT role FROM trip_members WHERE trip_id=? AND user_id=?',[tripId,userId]))[0];
app.get('/api/health',wrap(async(req,res)=>{ await pool.query('SELECT 1'); res.json({ok:true,service:'TravelSense API',database:'connected'}); }));
app.get('/api/hotels/search',auth,wrap(async(req,res)=>{
 const s=z.object({destination:z.string().min(2).max(120),checkIn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),checkOut:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),adults:z.coerce.number().int().min(1).max(9).default(2)}).parse(req.query);
 if(s.checkOut<=s.checkIn) return res.status(400).json({error:'Check-out must be after check-in'});
 res.json(await searchHotels(s));
}));

app.post('/api/auth/register',wrap(async(req,res)=>{
 const s=z.object({name:z.string().min(2).max(80),email:z.string().email(),password:z.string().min(8)}).parse(req.body);
 const hash=await bcrypt.hash(s.password,12);
 const result=await query('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',[s.name,s.email.toLowerCase(),hash]);
 const user={id:result.insertId,name:s.name,email:s.email.toLowerCase()};
 res.status(201).json({token:signToken(user),user});
}));
app.post('/api/auth/login',wrap(async(req,res)=>{
 const s=z.object({email:z.string().email(),password:z.string()}).parse(req.body);
 const user=(await query('SELECT id,name,email,password_hash FROM users WHERE email=?',[s.email.toLowerCase()]))[0];
 if(!user||!await bcrypt.compare(s.password,user.password_hash)) return res.status(401).json({error:'Email or password is incorrect'});
 res.json({token:signToken(user),user:{id:user.id,name:user.name,email:user.email}});
}));
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));

app.post('/api/trips',auth,wrap(async(req,res)=>{
 const s=z.object({name:z.string().min(2).max(120),destination:z.string().min(2),startDate:z.string().optional().nullable(),endDate:z.string().optional().nullable(),memberLimit:z.number().int().min(1).max(100),budget:z.number().nonnegative(),currency:z.string().default('INR')}).parse(req.body);
 const r=await query('INSERT INTO trips(name,destination,start_date,end_date,member_limit,budget,currency,created_by) VALUES(?,?,?,?,?,?,?,?)',[s.name,s.destination,s.startDate||null,s.endDate||null,s.memberLimit,s.budget,s.currency,req.user.id]);
 await query('INSERT INTO trip_members(trip_id,user_id,role,status) VALUES(?,?,?,?)',[r.insertId,req.user.id,'owner','accepted']);
 res.status(201).json({id:r.insertId,...s});
}));
app.get('/api/trips',auth,wrap(async(req,res)=>{
 const trips=await query(`SELECT t.*,tm.role,(SELECT COUNT(*) FROM trip_members x WHERE x.trip_id=t.id AND x.status='accepted') member_count FROM trips t JOIN trip_members tm ON tm.trip_id=t.id WHERE tm.user_id=? ORDER BY t.created_at DESC`,[req.user.id]);
 res.json(trips);
}));
app.get('/api/trips/:id',auth,wrap(async(req,res)=>{
 const access=await tripAccess(req.params.id,req.user.id); if(!access) return res.sendStatus(404);
 const [trip]=await query('SELECT * FROM trips WHERE id=?',[req.params.id]);
 const members=await query(`SELECT u.id,u.name,u.email,tm.role,tm.status,tm.share_location,tm.joined_at FROM trip_members tm JOIN users u ON u.id=tm.user_id WHERE tm.trip_id=?`,[req.params.id]);
 res.json({trip,members});
}));
app.post('/api/trips/:id/invitations',auth,wrap(async(req,res)=>{
 const access=await tripAccess(req.params.id,req.user.id); if(!access||!['owner','admin'].includes(access.role)) return res.sendStatus(403);
 const email=z.string().email().parse(req.body.email).toLowerCase();
 const invitee=(await query('SELECT id FROM users WHERE email=?',[email]))[0]; if(!invitee) return res.status(404).json({error:'Ask this person to create an account first'});
 await query('INSERT INTO trip_members(trip_id,user_id,role,status) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status)',[req.params.id,invitee.id,'member','accepted']);
 res.status(201).json({message:'Member added to trip'});
}));
app.post('/api/trips/:id/location-sharing',auth,wrap(async(req,res)=>{
 const enabled=z.boolean().parse(req.body.enabled);
 await query('UPDATE trip_members SET share_location=? WHERE trip_id=? AND user_id=?',[enabled,req.params.id,req.user.id]);
 if(!enabled) { await query('DELETE FROM live_locations WHERE trip_id=? AND user_id=?',[req.params.id,req.user.id]); io.to(`trip:${req.params.id}`).emit('location:removed',{userId:req.user.id}); }
 res.json({sharing:enabled});
}));
app.get('/api/trips/:id/locations',auth,wrap(async(req,res)=>{
 if(!await tripAccess(req.params.id,req.user.id)) return res.sendStatus(404);
 res.json(await query(`SELECT l.user_id userId,u.name,l.latitude lat,l.longitude lng,l.accuracy,l.updated_at updatedAt FROM live_locations l JOIN users u ON u.id=l.user_id JOIN trip_members tm ON tm.trip_id=l.trip_id AND tm.user_id=l.user_id WHERE l.trip_id=? AND tm.share_location=1`,[req.params.id]));
}));
app.post('/api/trips/:id/expenses',auth,wrap(async(req,res)=>{
 if(!await tripAccess(req.params.id,req.user.id)) return res.sendStatus(404);
 const s=z.object({title:z.string().min(2),amount:z.number().positive(),paidBy:z.number().int(),owedBy:z.number().int(),notes:z.string().optional()}).refine(v=>v.paidBy!==v.owedBy,{message:'Payer and debtor must be different members'}).parse(req.body);
 const members=await query('SELECT user_id FROM trip_members WHERE trip_id=? AND status="accepted" AND user_id IN (?,?)',[req.params.id,s.paidBy,s.owedBy]);
 if(members.length!==new Set([s.paidBy,s.owedBy]).size) return res.status(400).json({error:'Both people must be accepted trip members'});
 const r=await query('INSERT INTO expenses(trip_id,title,amount,paid_by,owed_by,notes,created_by) VALUES(?,?,?,?,?,?,?)',[req.params.id,s.title,s.amount,s.paidBy,s.owedBy,s.notes||null,req.user.id]);
 await query('INSERT INTO notifications(trip_id,user_id,type,message) VALUES(?,?,?,?)',[req.params.id,s.owedBy,'expense.created',`You owe ${s.amount} for ${s.title}.`]);
 const [expense]=await query(`SELECT e.*,p.name paid_by_name,o.name owed_by_name FROM expenses e JOIN users p ON p.id=e.paid_by JOIN users o ON o.id=e.owed_by WHERE e.id=?`,[r.insertId]);
 io.to(`trip:${req.params.id}`).emit('expense:created',expense);
 res.status(201).json(expense);
}));
app.get('/api/trips/:id/expenses',auth,wrap(async(req,res)=>{
 if(!await tripAccess(req.params.id,req.user.id)) return res.sendStatus(404);
 res.json(await query(`SELECT e.*,p.name paid_by_name,o.name owed_by_name FROM expenses e JOIN users p ON p.id=e.paid_by JOIN users o ON o.id=e.owed_by WHERE e.trip_id=? ORDER BY e.created_at DESC`,[req.params.id]));
}));
app.post('/api/expenses/:id/settle',auth,wrap(async(req,res)=>{
 const [e]=await query('SELECT * FROM expenses WHERE id=?',[req.params.id]); if(!e) return res.sendStatus(404);
 if(!await tripAccess(e.trip_id,req.user.id)) return res.sendStatus(403);
 if(req.user.id!==e.owed_by&&req.user.id!==e.paid_by) return res.sendStatus(403);
 await query('UPDATE expenses SET status="settled",settled_at=NOW() WHERE id=?',[e.id]);
 io.to(`trip:${e.trip_id}`).emit('expense:settled',{id:e.id});
 res.json({message:'Expense marked as settled'});
}));
app.get('/api/trips/:id/notifications',auth,wrap(async(req,res)=>{
 if(!await tripAccess(req.params.id,req.user.id)) return res.sendStatus(404);
 res.json(await query('SELECT * FROM notifications WHERE trip_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50',[req.params.id,req.user.id]));
}));

io.use(async(socket,next)=>{
 try { const token=socket.handshake.auth?.token; if(!token) throw Error('missing token'); socket.user=(await import('jsonwebtoken')).default.verify(token,process.env.JWT_SECRET); next(); }
 catch { next(new Error('Unauthorized')); }
});
io.on('connection',socket=>{
 socket.on('trip:join',async({tripId})=>{
   if(!await tripAccess(tripId,socket.user.id)) return;
   socket.join(`trip:${tripId}`);
 });
 socket.on('location:update',async({tripId,lat,lng,accuracy})=>{
   if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180) return;
   const access=await tripAccess(tripId,socket.user.id); if(!access) return;
   const member=(await query('SELECT share_location FROM trip_members WHERE trip_id=? AND user_id=?',[tripId,socket.user.id]))[0];
   if(!member?.share_location) return;
   await query(`INSERT INTO live_locations(trip_id,user_id,latitude,longitude,accuracy) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE latitude=VALUES(latitude),longitude=VALUES(longitude),accuracy=VALUES(accuracy),updated_at=NOW()`,[tripId,socket.user.id,lat,lng,accuracy||null]);
   socket.to(`trip:${tripId}`).emit('location:updated',{userId:socket.user.id,name:socket.user.name,lat,lng,accuracy,updatedAt:new Date().toISOString()});
 });
});
app.use((err,req,res,next)=>{ console.error('[TravelSense API]',err); if(err instanceof z.ZodError) return res.status(400).json({error:err.issues[0]?.message||'Invalid input'}); if(err.code==='ER_DUP_ENTRY') return res.status(409).json({error:'An account with this email or this membership already exists'}); const message=process.env.NODE_ENV==='production'?'Server error':(err.message||'Server error'); res.status(500).json({error:message}); });
const port=process.env.PORT||4000;
server.listen(port,()=>console.log(`TravelSense API listening on ${port}`));
