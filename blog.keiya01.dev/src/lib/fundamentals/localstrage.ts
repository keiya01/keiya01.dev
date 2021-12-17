type Storage = {
  theme: "dark" | "light";
};

type StorageKey = keyof Storage;

export const setDataToLocalStorage = (
  key: StorageKey,
  value: Storage[StorageKey]
): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.setItem(key, value);
    resolve();
  });
};

export const getDataFromLocalStorage = (
  key: StorageKey
): Promise<Storage[StorageKey] | null> => {
  return new Promise((resolve) => {
    resolve(localStorage.getItem(key) as Storage[StorageKey]);
  });
};
