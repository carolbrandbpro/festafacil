const base = import.meta.env.VITE_API_URL || "";

const url = (path: string) => (base ? `${base}${path}` : path);

export async function getArrivals(): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(url("/api/arrivals"));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {};
  }
}

export async function setArrived(id: string, arrived: boolean): Promise<void> {
  try {
    await fetch(url(`/api/guests/${id}/arrived`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrived }),
    });
  } catch {
    return;
  }
}

