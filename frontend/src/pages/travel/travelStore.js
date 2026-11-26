// No travel backend yet — requests are stored in this browser under the same
// key/shape as the standalone BRISK OLIVE Travel Management demo.
export const STORAGE_KEY = "boTravel_trips";

export function loadTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrips(trips) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}
