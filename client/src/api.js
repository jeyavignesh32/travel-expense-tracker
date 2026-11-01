const API=import.meta.env.VITE_API_URL||'http://localhost:4000';
export function token(){return localStorage.getItem('ts_token')}
export async function api(path,options={}){
 const res=await fetch(`${API}/api${path}`,{...options,headers:{'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`}:{ }),...(options.headers||{})}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(data.error||'Request failed');
 return data;
}
export {API};
