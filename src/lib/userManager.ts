const USER_ID_KEY = 'rag_user_id';

export const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const clearUserId = (): void => {
  localStorage.removeItem(USER_ID_KEY);
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(USER_ID_KEY);
};
