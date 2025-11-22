
const DB_NAME = 'InkDreamDB';
const STORE_NAME = 'gallery';
const VERSION = 1;

export interface DBItem {
  id: string;
  type: 'tryon' | 'imagine';
  timestamp: number;
  resultBlob: Blob;
  inputs: {
    main?: Blob; // Person for tryon
    secondary?: Blob; // Tattoo for tryon
    prompt?: string; // For imagine
    refs?: Blob[]; // For imagine
  };
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveItem = async (item: DBItem) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getItemsByType = async (type: 'tryon' | 'imagine'): Promise<DBItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('type');
    const request = index.getAll(type);
    request.onsuccess = () => {
        const results = request.result as DBItem[];
        // Sort descending by timestamp
        resolve(results.sort((a, b) => b.timestamp - a.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteItem = async (id: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- Helpers ---

export const base64ToBlob = async (base64: string, mimeType: string = 'image/png'): Promise<Blob> => {
  // Handle cases where base64 string might already include the data URI prefix
  const uri = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
  const res = await fetch(uri);
  return await res.blob();
}

export const blobToURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
}

export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result as string;
          // Return raw base64 without prefix if possible, or just return full string and let caller handle
          resolve(result.split(',')[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
  });
}
