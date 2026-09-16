"use client";

export type MapMarker = {
  id: string;
  type: string;
  name: string;
  notes?: string;
  regionId?: string;
  lat: number;
  lng: number;
  createdAt: number;
};

const DB_NAME = "aniimo-map";
const STORE = "markers";
const VERSION = 1;

function hasIDB(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const req = run(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function getAllMarkers(): Promise<MapMarker[]> {
  if (!hasIDB()) return [];
  const all = await tx<MapMarker[]>("readonly", (s) => s.getAll() as IDBRequest<MapMarker[]>);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function putMarker(marker: MapMarker): Promise<void> {
  if (!hasIDB()) return;
  await tx("readwrite", (s) => s.put(marker));
}

export async function deleteMarker(id: string): Promise<void> {
  if (!hasIDB()) return;
  await tx("readwrite", (s) => s.delete(id));
}

export async function clearMarkers(): Promise<void> {
  if (!hasIDB()) return;
  await tx("readwrite", (s) => s.clear());
}

export async function bulkPutMarkers(markers: MapMarker[]): Promise<void> {
  if (!hasIDB() || markers.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    for (const m of markers) store.put(m);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
