import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, API, token } from './api';
import { findDestination, findAttractions } from './tourismService';
import { fetchNearbyPlaces } from './overpassService';
import { CATEGORY_KEYS, CATEGORIES } from './categories';
import MapView from './MapView';
import './App.css';
import './fullstack.css';

const money = (n) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(n || 0));

function EmptyState({ icon = '✦', title, children, action }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{children}</p>{action}</div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('overview');
  const [authMode, setAuthMode] = useState('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [tripForm, setTripForm] = useState({ name: 'Weekend getaway', destination: 'Goa', memberLimit: 5, budget: 25000, startDate: '', endDate: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [expense, setExpense] = useState({ title: '', amount: '', paidBy: '', owedBy: '', notes: '' });
  const [position, setPosition] = useState(null);
  const [attractionQuery, setAttractionQuery] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [attractionBusy, setAttractionBusy] = useState(false);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [mapPlaces, setMapPlaces] = useState([]);
  const [mapCategories, setMapCategories] = useState(CATEGORY_KEYS);
  const [mapRadius, setMapRadius] = useState(5000);
  const [mapSearchBusy, setMapSearchBusy] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [hotelMessage, setHotelMessage] = useState('');
  const [hotelDates, setHotelDates] = useState({ checkIn: '', checkOut: '' });
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token()) return;
    api('/me').then((r) => setUser(r.user)).catch(() => {
      localStorage.removeItem('ts_token');
      setError('Your session expired. Please sign in again.');
    });
  }, []);

  useEffect(() => {
    if (user) loadTrips();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!trip || !token()) return undefined;
    const socket = io(API, { auth: { token: token() } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('trip:join', { tripId: trip.id }));
    socket.on('location:updated', (p) => setLocations((old) => [...old.filter((x) => x.userId !== p.userId), p]));
    socket.on('location:removed', (p) => setLocations((old) => old.filter((x) => x.userId !== p.userId)));
    socket.on('expense:created', async () => {
      try {
        setExpenses(await api(`/trips/${trip.id}/expenses`));
        setNotifications(await api(`/trips/${trip.id}/notifications`));
      } catch (e) { setError(e.message); }
    });
    socket.on('expense:settled', async () => {
      try { setExpenses(await api(`/trips/${trip.id}/expenses`)); } catch (e) { setError(e.message); }
    });
    return () => { socket.disconnect(); if (socketRef.current === socket) socketRef.current = null; };
  }, [trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sharing || !trip || !navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      setPosition({ lat: p.lat, lon: p.lng, accuracy: p.accuracy });
      socketRef.current?.emit('location:update', { tripId: trip.id, ...p });
    }, () => setError('Location access was interrupted. Check your browser location permission.'), {
      enableHighAccuracy: true, maximumAge: 5000, timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [sharing, trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTrips() {
    try {
      const data = await api('/trips');
      setTrips(data);
      if (!trip && data[0]) await selectTrip(data[0].id);
    } catch (e) { setError(e.message); }
  }

  async function selectTrip(id) {
    try {
      setError('');
      const data = await api(`/trips/${id}`);
      setTrip(data.trip);
      setMembers(data.members);
      const me = data.members.find((m) => Number(m.id) === Number(user?.id));
      setSharing(Boolean(me?.share_location));
      const [ex, loc, notes] = await Promise.all([
        api(`/trips/${id}/expenses`), api(`/trips/${id}/locations`), api(`/trips/${id}/notifications`),
      ]);
      setExpenses(ex); setLocations(loc); setNotifications(notes);
      setExpense((v) => ({ ...v, paidBy: String(data.members[0]?.id || ''), owedBy: String(data.members[1]?.id || data.members[0]?.id || '') }));
      setTab('overview');
    } catch (e) { setError(e.message); }
  }

  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const data = await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(authForm) });
      localStorage.setItem('ts_token', data.token);
      setUser(data.user);
    } catch (e) {
      setError(e.message === 'Server error'
        ? 'The server could not complete this request. Check the backend CMD window for the database error.'
        : e.message);
    } finally { setBusy(false); }
  }

  async function createTrip(e) {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const created = await api('/trips', { method: 'POST', body: JSON.stringify({
        ...tripForm, memberLimit: Number(tripForm.memberLimit), budget: Number(tripForm.budget),
      }) });
      const updated = await api('/trips'); setTrips(updated);
      await selectTrip(created.id); setTab('overview'); setSuccess('Your trip has been created.');
    } catch (e) { setError(e.message); }
  }

  async function invite(e) {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      await api(`/trips/${trip.id}/invitations`, { method: 'POST', body: JSON.stringify({ email: inviteEmail }) });
      setInviteEmail(''); await selectTrip(trip.id); setSuccess('Member added to your trip.');
    } catch (e) { setError(e.message); }
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('This browser does not support location sharing.'));
      navigator.geolocation.getCurrentPosition(resolve, (err) => {
        const message = err.code === 1 ? 'Location permission was denied. Allow location access in your browser and try again.'
          : err.code === 3 ? 'Location request timed out. Please try again.' : 'Your location is currently unavailable.';
        reject(new Error(message));
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
    });
  }

  async function locateMe() {
    setError('');
    try {
      const pos = await getCurrentPosition();
      setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
    } catch (e) { setError(e.message); }
  }

  async function toggleSharing() {
    if (!trip || sharingBusy) return;
    setSharingBusy(true); setError(''); setSuccess('');
    try {
      const enabled = !sharing;
      if (enabled) {
        const pos = await getCurrentPosition();
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
      }
      await api(`/trips/${trip.id}/location-sharing`, { method: 'POST', body: JSON.stringify({ enabled }) });
      setSharing(enabled);
      if (!enabled) {
        setLocations((old) => old.filter((x) => Number(x.userId) !== Number(user.id)));
        setSuccess('Location sharing stopped.');
      } else {
        setSuccess('Location sharing is on. Your trip members can now see your latest location.');
        socketRef.current?.emit('trip:join', { tripId: trip.id });
      }
      const refreshed = await api(`/trips/${trip.id}/locations`); setLocations(refreshed);
    } catch (e) { setError(e.message); }
    finally { setSharingBusy(false); }
  }

  async function addExpense(e) {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      await api(`/trips/${trip.id}/expenses`, { method: 'POST', body: JSON.stringify({
        ...expense, amount: Number(expense.amount), paidBy: Number(expense.paidBy), owedBy: Number(expense.owedBy),
      }) });
      setExpenses(await api(`/trips/${trip.id}/expenses`));
      setExpense((v) => ({ ...v, title: '', amount: '', notes: '' }));
      setSuccess('Expense added to the trip ledger.');
    } catch (e) { setError(e.message); }
  }

  async function settle(id) {
    try { await api(`/expenses/${id}/settle`, { method: 'POST' }); setExpenses(await api(`/trips/${trip.id}/expenses`)); setSuccess('Expense marked as settled.'); }
    catch (e) { setError(e.message); }
  }

  async function searchNearbyOnMap() {
    setMapSearchBusy(true);
    setError('');
    setSuccess('');
    try {
      const selectedPosition = position || await getCurrentPosition().then((pos) => ({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }));
      setPosition(selectedPosition);
      if (!mapCategories.length) throw new Error('Select at least one place category.');
      const results = await fetchNearbyPlaces(
        selectedPosition.lat,
        selectedPosition.lon,
        Number(mapRadius),
        mapCategories,
      );
      setMapPlaces(results);
      setSuccess(results.length
        ? `Found ${results.length} mapped places. Select a marker to see its details.`
        : 'No mapped places were found in this radius. Try a larger radius or another category.');
    } catch (e) {
      setError(e.message || 'Nearby place search failed. Please try again.');
    } finally {
      setMapSearchBusy(false);
    }
  }

  async function discover(e) {
    e.preventDefault(); setAttractionBusy(true); setError(''); setAttractions([]); setNearbyServices([]);
    try {
      const destination = await findDestination(attractionQuery || trip?.destination || 'Chennai');
      setDestinationCoords({ lat: destination.lat, lon: destination.lon });
      const [found, services] = await Promise.all([
        findAttractions(destination.lat, destination.lon),
        fetchNearbyPlaces(destination.lat, destination.lon, 10000, CATEGORY_KEYS),
      ]);
      setAttractions(found); setNearbyServices(services);
      if (!found.length && !services.length) setSuccess('No places were returned. Try another destination or search again later.');
    } catch (e) { setError(e.message); }
    finally { setAttractionBusy(false); }
  }

  async function searchHotels(e) {
    e.preventDefault(); setHotelMessage('Searching hotel supplier…'); setHotels([]); setError('');
    try {
      const q = new URLSearchParams({ destination: trip.destination, checkIn: hotelDates.checkIn, checkOut: hotelDates.checkOut, adults: '2' });
      const result = await api(`/hotels/search?${q.toString()}`);
      if (result.configured && result.hotels?.length) {
        setHotels(result.hotels);
        setHotelMessage('Live rates returned by your configured hotel supplier.');
      } else {
        const destination = destinationCoords || await findDestination(trip.destination).then(({lat,lon}) => ({lat,lon}));
        const mapped = await fetchNearbyPlaces(destination.lat, destination.lon, 10000, ['hotel','motel','guest_house','hostel']);
        setHotels(mapped.map((h) => ({ id:h.id, name:h.name, address:h.address || h.subtype || 'Address not listed', searchUrl:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(trip.destination)}` })));
        setHotelMessage(mapped.length ? 'No live rate provider is connected. Showing real mapped hotels; open Check availability for current prices.' : 'No mapped hotels found nearby. Try a wider destination or connect a hotel supplier for live rates.');
      }
    } catch (e) { setHotelMessage(e.message); }
  }

  function logout() { localStorage.removeItem('ts_token'); socketRef.current?.disconnect(); setUser(null); setTrip(null); setTrips([]); setSharing(false); }

  const pending = expenses.filter((e) => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
  const settled = expenses.filter((e) => e.status === 'settled').reduce((sum, e) => sum + Number(e.amount), 0);

  if (!user) return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submitAuth}>
        <div className="brand-mark">✦</div><h1>TravelSense</h1><p>Your trip, together.</p>
        <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        {authMode === 'register' && <input placeholder="Full name" autoComplete="name" minLength="2" maxLength="80" required value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />}
        <input type="email" placeholder="Email address" autoComplete="email" required value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
        <input type="password" placeholder="Password (at least 8 characters)" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength="8" required value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="auth-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>{authMode === 'login' ? 'New to TravelSense? Create account' : 'Already registered? Sign in'}</button>
      </form>
    </div>
  );

  const nav = [
    ['overview', '⌂', 'Overview'], ['map', '◎', 'Live map'], ['members', '♧', 'Trip members'],
    ['expenses', '₹', 'Expenses'], ['discover', '⌖', 'Discover places'], ['notifications', '♢', 'Notifications'],
  ];

  return (
    <div className="ts-shell">
      <aside className="ts-sidebar">
        <div className="ts-brand"><span>✦</span><b>TravelSense</b></div>
        <small>WORKSPACE</small>
        {nav.map(([key, icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setError(''); }}>{icon} &nbsp; {label}{key === 'notifications' && notifications.some((n) => !n.read_at) ? ' •' : ''}</button>)}
        <div className="trip-switch"><small>YOUR TRIPS</small>
          {trips.map((t) => <button key={t.id} onClick={() => selectTrip(t.id)} className={trip?.id === t.id ? 'active' : ''}>{t.name}</button>)}
          <button onClick={() => setTab('create')} className="new-trip">＋ Create trip</button>
        </div>
        <div className="profile"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><b>{user.name}</b><small>{user.email}</small></div><button aria-label="Sign out" onClick={logout}>↪</button></div>
      </aside>

      <main className="ts-main">
        <header><div><small>TRIP WORKSPACE</small><h1>{tab === 'create' ? 'Create a trip' : trip?.name || 'Your trips'}</h1><p>{trip?.destination || 'Plan, explore and split together'}</p></div><div className="header-actions"><span className="online-dot">● API connected</span><button onClick={() => setTab('create')}>＋ Create trip</button></div></header>
        {error && <div className="notice" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
        {success && <div className="success-notice" role="status"><span>{success}</span><button onClick={() => setSuccess('')} aria-label="Dismiss">×</button></div>}

        {tab === 'create' && <section className="panel page-panel"><div className="section-kicker">PLAN TOGETHER</div><h2>Create your group trip</h2><p>Set up the basics now. You can invite people and record expenses after creating the trip.</p>
          <form className="form-grid" onSubmit={createTrip}>
            <label>Trip name<input required minLength="2" maxLength="120" value={tripForm.name} onChange={(e) => setTripForm({ ...tripForm, name: e.target.value })} /></label>
            <label>Destination<input required minLength="2" value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} /></label>
            <label>Total members<input type="number" min="1" max="100" value={tripForm.memberLimit} onChange={(e) => setTripForm({ ...tripForm, memberLimit: e.target.value })} /></label>
            <label>Total budget (₹)<input type="number" min="0" value={tripForm.budget} onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })} /></label>
            <label>Start date<input type="date" value={tripForm.startDate} onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })} /></label>
            <label>End date<input type="date" min={tripForm.startDate || undefined} value={tripForm.endDate} onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })} /></label>
            <button disabled={busy}>Create trip & continue</button>
          </form>
        </section>}

        {!trip && tab !== 'create' && tab !== 'map' && <section className="panel"><EmptyState icon="🧭" title="Your next trip starts here" action={<button onClick={() => setTab('create')}>＋ Create your first trip</button>}>Create a trip to invite your group, share locations with consent, discover places and keep expenses together. You can explore nearby places on the Live map without creating a trip.</EmptyState></section>}

        {!trip && tab === 'map' && <section className="panel page-panel">
          <div className="panel-head"><div><h2>Nearby places map</h2><p>Explore hospitals, hotels, schools, pharmacies, attractions and more around your current location.</p></div><button className="secondary" onClick={locateMe}>Locate me</button></div>
          <div className="nearby-map-controls" style={{display:'grid',gap:12,margin:'16px 0'}}>
            <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
              <label style={{display:'flex',gap:8,alignItems:'center'}}>Search radius
                <select value={mapRadius} onChange={(e)=>setMapRadius(Number(e.target.value))}>
                  <option value={1000}>1 km</option><option value={3000}>3 km</option><option value={5000}>5 km</option><option value={10000}>10 km</option><option value={20000}>20 km</option>
                </select>
              </label>
              <button onClick={searchNearbyOnMap} disabled={mapSearchBusy}>{mapSearchBusy ? 'Searching nearby places…' : 'Find places near me'}</button>
              <button className="secondary" onClick={()=>setMapCategories(CATEGORY_KEYS)}>Select all</button>
              <button className="secondary" onClick={()=>setMapCategories([])}>Clear</button>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {CATEGORY_KEYS.map((key)=>(
                <label key={key} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 9px',border:'1px solid #dbe3ec',borderRadius:18,fontSize:13}}>
                  <input type="checkbox" checked={mapCategories.includes(key)} onChange={(e)=>setMapCategories((old)=>e.target.checked?[...old,key]:old.filter((x)=>x!==key))}/>
                  <span>{CATEGORIES[key].icon} {CATEGORIES[key].label}</span>
                </label>
              ))}
            </div>
            <small>{mapPlaces.length} nearby places loaded. Select categories and search again to refresh results.</small>
          </div>
          <div className="map-wrap"><MapView position={position} places={mapPlaces} radius={mapRadius}/></div>
        </section>}

        {trip && tab !== 'create' && <>
          <section className="stats">
            <div><small>TRIP BUDGET</small><strong>{money(trip.budget)}</strong><span>{trip.destination}</span></div>
            <div><small>MEMBERS JOINED</small><strong>{members.length} / {trip.member_limit}</strong><span>Trip participants</span></div>
            <div><small>OUTSTANDING EXPENSES</small><strong>{money(pending)}</strong><span>{money(settled)} settled</span></div>
            <div><small>LIVE LOCATIONS</small><strong>{locations.length}</strong><span>Consenting members only</span></div>
          </section>

          {tab === 'overview' && <div className="content-grid">
            <section className="panel"><div className="panel-head"><div><h2>Trip map</h2><p>Only members who opt in appear here.</p></div><button onClick={() => setTab('map')}>Open live map ↗</button></div><TripMap position={position} locations={locations} /></section>
            <section className="panel"><div className="panel-head"><div><h2>Trip members</h2><p>{members.length} people in this trip</p></div><button onClick={() => setTab('members')}>Manage</button></div>
              {members.length ? members.slice(0, 6).map((m) => <div className="member-row" key={m.id}><div className="avatar">{m.name?.[0]?.toUpperCase()}</div><div><b>{m.name}</b><small>{m.role} · {m.share_location ? 'Sharing location' : 'Location private'}</small></div></div>) : <EmptyState title="No members yet">Invite your travel group to get started.</EmptyState>}
              <button className="secondary full-button" onClick={() => setTab('members')}>Invite a member</button>
            </section>
            <section className="panel"><h2>Recent expenses</h2>{expenses.length ? expenses.slice(0, 4).map((e) => <div className="expense-row" key={e.id}><div><b>{e.title}</b><small>{e.owed_by_name} owes {e.paid_by_name}</small></div><strong>{money(e.amount)}</strong></div>) : <EmptyState icon="₹" title="No expenses recorded">Add shared costs to keep track of who owes whom.</EmptyState>}<button className="secondary full-button" onClick={() => setTab('expenses')}>Open expense ledger</button></section>
            <section className="panel"><h2>Trip details</h2><div className="detail-list"><div><span>Destination</span><b>{trip.destination}</b></div><div><span>Start date</span><b>{trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-IN') : 'Not set'}</b></div><div><span>End date</span><b>{trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-IN') : 'Not set'}</b></div><div><span>Budget</span><b>{money(trip.budget)}</b></div></div></section>
          </div>}

          {tab === 'map' && <section className="panel page-panel">
            <div className="panel-head"><div><h2>Nearby places & live trip map</h2><p>Find hospitals, hotels, schools, attractions and other services around your current location.</p></div><div className="map-actions"><button className="secondary" onClick={locateMe}>Locate me</button><button onClick={toggleSharing} disabled={sharingBusy}>{sharingBusy ? 'Please wait…' : sharing ? 'Stop sharing' : 'Share my location'}</button></div></div>
            <div className="sharing-banner"><span className={sharing ? 'sharing-indicator on' : 'sharing-indicator'} />{sharing ? 'Your trip location sharing is ON.' : 'Your location remains private unless you explicitly turn on trip sharing.'}</div>
            <div className="nearby-map-controls" style={{display:'grid',gap:12,margin:'16px 0'}}>
              <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                <label style={{display:'flex',gap:8,alignItems:'center'}}>Search radius
                  <select value={mapRadius} onChange={(e)=>setMapRadius(Number(e.target.value))}>
                    <option value={1000}>1 km</option><option value={3000}>3 km</option><option value={5000}>5 km</option><option value={10000}>10 km</option><option value={20000}>20 km</option>
                  </select>
                </label>
                <button onClick={searchNearbyOnMap} disabled={mapSearchBusy}>{mapSearchBusy ? 'Searching nearby places…' : 'Find places near me'}</button>
                <button className="secondary" onClick={()=>setMapCategories(CATEGORY_KEYS)}>Select all categories</button>
                <button className="secondary" onClick={()=>setMapCategories([])}>Clear categories</button>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {CATEGORY_KEYS.map((key)=>(
                  <label key={key} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 9px',border:'1px solid #dbe3ec',borderRadius:18,fontSize:13}}>
                    <input type="checkbox" checked={mapCategories.includes(key)} onChange={(e)=>setMapCategories((old)=>e.target.checked?[...old,key]:old.filter((x)=>x!==key))}/>
                    <span>{CATEGORIES[key].icon} {CATEGORIES[key].label}</span>
                  </label>
                ))}
              </div>
              <small>{mapPlaces.length} nearby places loaded. Data availability depends on OpenStreetMap coverage and network access.</small>
            </div>
            <div className="map-wrap"><MapView position={position} places={mapPlaces} extendedPlaces={[]} radius={mapRadius} members={locations}/></div>
            <div className="member-chips">{locations.length ? locations.map((l) => <span key={l.userId}>● {l.name}</span>) : <small>No trip members are sharing their location yet.</small>}</div>
            <p className="privacy-note">Nearby place discovery does not share your location with trip members. Trip sharing is separate and requires your consent. Browser location updates stop when this tab/browser stops; background tracking while a phone is locked requires a native mobile app.</p>
          </section>}

          {tab === 'members' && <section className="panel page-panel"><div className="section-kicker">YOUR TRAVEL GROUP</div><h2>Members & invitations</h2><p>Invite people who already have a TravelSense account using their registered email address.</p>
            <form className="invite-form" onSubmit={invite}><input type="email" placeholder="Friend's registered email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required /><button>Invite member</button></form>
            {members.length ? members.map((m) => <div className="member-row" key={m.id}><div className="avatar">{m.name?.[0]?.toUpperCase()}</div><div><b>{m.name}</b><small>{m.email} · {m.role} · {m.status}</small></div><span className="tag">{m.share_location ? 'Sharing location' : 'Location private'}</span></div>) : <EmptyState title="No members yet">You are the first person in this trip. Invite your group above.</EmptyState>}
          </section>}

          {tab === 'expenses' && <div className="content-grid">
            <section className="panel"><div className="section-kicker">SHARED COSTS</div><h2>Record an expense</h2><p>This version records a direct amount one member paid on behalf of another.</p>
              {members.length < 2 ? <EmptyState title="Invite another member first">At least two accepted members are needed to record an expense.</EmptyState> : <form className="stack-form" onSubmit={addExpense}>
                <label>Expense title<input placeholder="e.g. Hotel booking" value={expense.title} onChange={(e) => setExpense({ ...expense, title: e.target.value })} required minLength="2" /></label>
                <label>Amount (₹)<input type="number" min="1" step="0.01" placeholder="0.00" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} required /></label>
                <label>Paid by<select value={expense.paidBy} onChange={(e) => setExpense({ ...expense, paidBy: e.target.value })} required>{members.map((m) => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label>
                <label>Owed by<select value={expense.owedBy} onChange={(e) => setExpense({ ...expense, owedBy: e.target.value })} required>{members.filter((m) => String(m.id) !== String(expense.paidBy)).map((m) => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label>
                <label>Notes (optional)<input value={expense.notes} onChange={(e) => setExpense({ ...expense, notes: e.target.value })} /></label>
                <button>Save expense & notify trip</button>
              </form>}
            </section>
            <section className="panel"><div className="panel-head"><div><h2>Expense ledger</h2><p>{expenses.length} recorded expenses</p></div><strong>{money(pending)} pending</strong></div>
              {expenses.length ? expenses.map((e) => <div className="expense-row" key={e.id}><div><b>{e.title}</b><small>{e.owed_by_name} owes {e.paid_by_name} · {new Date(e.created_at).toLocaleDateString('en-IN')}</small><span className={e.status === 'settled' ? 'status-settled' : 'status-pending'}>{e.status}</span></div><strong>{money(e.amount)}</strong><button disabled={e.status === 'settled'} onClick={() => settle(e.id)}>{e.status === 'settled' ? 'Settled' : 'Mark paid'}</button></div>) : <EmptyState icon="₹" title="No expenses yet">Your group's recorded expenses will appear here.</EmptyState>}
            </section>
          </div>}

          {tab === 'discover' && <section className="panel page-panel"><div className="section-kicker">EXPLORE YOUR DESTINATION</div><h2>Discover places</h2><p>Search attractions and nearby services around a destination. Results depend on public OpenStreetMap data availability.</p>
            <form className="invite-form" onSubmit={discover}><input value={attractionQuery} onChange={(e) => setAttractionQuery(e.target.value)} placeholder={trip.destination || 'Enter a destination'} /><button disabled={attractionBusy}>{attractionBusy ? 'Searching…' : 'Search places'}</button></form>
            {attractionBusy && <p>Searching public map data…</p>}
            {destinationCoords && <div className="map-wrap" style={{marginTop:16}}><MapView position={{...destinationCoords,accuracy:0}} places={nearbyServices} extendedPlaces={attractions.map((a) => ({...a, category: a.type === 'historic' ? 'historic' : 'attraction'}))} radius={10000} /></div>}
            <h3>Tourist attractions · within 50 km</h3>
            {attractions.length ? attractions.map((a) => <div className="member-row" key={a.id}><div className="avatar">⌖</div><div><b>{a.name}</b><small>{a.type} · {a.lat.toFixed(4)}, {a.lon.toFixed(4)}</small></div><a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lon}#map=16/${a.lat}/${a.lon}`}>Open map ↗</a></div>) : <p className="muted-copy">No attraction results yet. Search a destination above.</p>}
            <h3 className="subsection-title">Nearby services · within 10 km</h3>
            {nearbyServices.length ? nearbyServices.slice(0, 40).map((x) => <div className="member-row" key={x.id}><div className="avatar">⌖</div><div><b>{x.name}</b><small>{x.category} · {x.address || 'Address not listed'}</small></div></div>) : <p className="muted-copy">Nearby service results will appear here after a search.</p>}
            <h3 className="subsection-title">Hotel price search</h3><p>Live room prices require a connected hotel supplier. No prices are fabricated when supplier access is not configured.</p>
            <form className="invite-form" onSubmit={searchHotels}><input aria-label="Check-in date" type="date" required value={hotelDates.checkIn} onChange={(e) => setHotelDates({ ...hotelDates, checkIn: e.target.value })} /><input aria-label="Check-out date" type="date" min={hotelDates.checkIn || undefined} required value={hotelDates.checkOut} onChange={(e) => setHotelDates({ ...hotelDates, checkOut: e.target.value })} /><button>Search hotels</button></form>
            {hotelMessage && <p className="notice">{hotelMessage}</p>}
            {hotels.map((h, i) => <div className="member-row" key={h.id || i}><div className="avatar">🏨</div><div><b>{h.name}</b><small>{h.address || h.location || 'Location not listed'}</small></div>{h.price != null ? <strong>{h.currency || '₹'}{h.price}</strong> : <a href={h.searchUrl || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(trip.destination)}`} target="_blank" rel="noreferrer">Check availability ↗</a>}</div>)}
          </section>}

          {tab === 'notifications' && <section className="panel page-panel"><div className="section-kicker">ACTIVITY</div><h2>Notifications</h2><p>Updates about expenses and activity in this trip.</p>
            {notifications.length ? notifications.map((n) => <div className="notification-row" key={n.id}><div className="notification-icon">♢</div><div><b>{n.message}</b><small>{n.type} · {new Date(n.created_at).toLocaleString('en-IN')}</small></div><span className={n.read_at ? 'tag' : 'tag unread-tag'}>{n.read_at ? 'Read' : 'Unread'}</span></div>) : <EmptyState icon="♢" title="You're all caught up">Trip notifications will appear here when there is activity.</EmptyState>}
          </section>}
        </>}
      </main>
    </div>
  );
}

function TripMap({ position, locations }) {
  return <div className="map-wrap"><MapView position={position} places={[]} extendedPlaces={[]} radius={50000} members={locations} /><div className="map-legend"><b>Live members</b>{locations.length ? locations.map((l) => <span key={l.userId}>● {l.name}</span>) : <small>No members are sharing their location yet.</small>}</div></div>;
}
