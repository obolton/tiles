export async function openDatabase(
  name: string,
  version: number,
  upgrade: (db: IDBDatabase) => void,
) {
  const request = indexedDB.open(name, version);
  return new Promise<IDBDatabase>((resolve, reject) => {
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("upgradeneeded", (event) =>
      upgrade((event.target as IDBOpenDBRequest).result),
    );
  });
}

function createRequestPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("success", () => resolve(request.result));
  });
}

export async function getRecord<T>(
  db: IDBDatabase,
  storeName: string,
  key: string,
) {
  const transaction = db.transaction(storeName, "readonly");
  const request = transaction.objectStore(storeName).get(key);
  return createRequestPromise<T>(request);
}

export async function putRecord<T>(
  db: IDBDatabase,
  storeName: string,
  key: string,
  value: T,
) {
  const transaction = db.transaction(storeName, "readwrite");
  const request = transaction.objectStore(storeName).put(value, key);
  return createRequestPromise(request);
}
