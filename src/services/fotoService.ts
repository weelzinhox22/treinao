export interface Foto {
  id: string;
  userId: string;
  url: string;
  date: string;
  description?: string;
}

const STORAGE_KEY = "fotos";

const getFotosFromStorage = (): Foto[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar fotos:", error);
    return [];
  }
};

const saveFotosToStorage = (fotos: Foto[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fotos));
  } catch (error) {
    console.error("Erro ao salvar fotos:", error);
  }
};

export const fotoService = {
  getFotos: (userId: string): Foto[] => {
    const fotos = getFotosFromStorage();
    return fotos
      .filter((f) => f.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addFoto: (userId: string, url: string, description?: string): Foto => {
    const fotos = getFotosFromStorage();
    const newFoto: Foto = {
      id: Date.now().toString(),
      userId,
      url,
      date: new Date().toISOString(),
      description,
    };

    fotos.push(newFoto);
    saveFotosToStorage(fotos);
    return newFoto;
  },

  deleteFoto: (id: string, userId: string): boolean => {
    const fotos = getFotosFromStorage();
    const filtered = fotos.filter((f) => !(f.id === id && f.userId === userId));

    if (filtered.length === fotos.length) return false;

    saveFotosToStorage(filtered);
    return true;
  },

  // Converter File para base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },
};

