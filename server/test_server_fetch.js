const test = async () => {
  try {
    const res = await fetch('https://wttr.in/Goa?format=j1');
    console.log('Weather status:', res.status);
    const data = await res.json();
    console.log('Weather temp:', data.current_condition?.[0]?.temp_C);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
};
test();
