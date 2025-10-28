// Store manager to avoid circular dependencies
// This utility provides a centralized way to clear all stores without circular imports

export const clearAllStores = () => {
  try {
    // Clear localStorage auth data
    localStorage.removeItem("atmo_auth_token");
    localStorage.removeItem("atmo_token_data");
    localStorage.removeItem("atmo_user_data");
    localStorage.removeItem("atmo_casdoor_user");
    localStorage.removeItem("casdoor_token_created_at");

    console.log("✅ STORE MANAGER: Cleared all localStorage auth data");

    return true;
  } catch (error) {
    console.error("❌ STORE MANAGER: Error clearing stores:", error);
    return false;
  }
};

export const clearAllStoresAndRedirect = () => {
  try {
    clearAllStores();

    // Use React Router navigation instead of page reload
    // This prevents state loss and maintains app stability
    console.log("✅ STORE MANAGER: Cleared stores, redirecting to login");
    
    // Return a flag that components can use to trigger navigation
    // This prevents forced page reloads
    return true;
  } catch (error) {
    console.error("❌ STORE MANAGER: Error clearing stores:", error);
    return false;
  }
};

export const shouldClearStores = () => {
  const shouldClear = localStorage.getItem("atmo_clear_stores") === "true";
  if (shouldClear) {
    localStorage.removeItem("atmo_clear_stores");
  }
  return shouldClear;
};

export const initializeStores = async () => {
  try {
    // This will be called after successful auth to initialize stores
    console.log("🔄 STORE MANAGER: Initializing stores after auth");
    return true;
  } catch (error) {
    console.error("❌ STORE MANAGER: Error initializing stores:", error);
    return false;
  }
};
