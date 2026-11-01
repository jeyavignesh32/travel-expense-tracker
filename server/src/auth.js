import jwt from 'jsonwebtoken';
export function signToken(user){ return jwt.sign({id:user.id,email:user.email,name:user.name},process.env.JWT_SECRET,{expiresIn:'7d'}); }
export function auth(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token) return res.status(401).json({error:'Authentication required'});
  try { req.user=jwt.verify(token,process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({error:'Invalid or expired session'}); }
}
