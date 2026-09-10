import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const FocusModeContext = createContext(null);

const loadFocusMode = () => {
  try {
    return localStorage.getItem("marine_focus_mode") === "true";
  } catch {
    return false;
  }
};

export const FocusModeProvider = ({ children }) => {
  const [focusMode, setFocusMode] = useState(loadFocusMode);

  useEffect(() => {
    try {
      localStorage.setItem("marine_focus_mode", String(focusMode));
    } catch {
      // Ignore persistence failures.
    }
  }, [focusMode]);

  const value = useMemo(
    () => ({
      focusMode,
      alarmMuted: focusMode,
      setFocusMode,
      toggleFocusMode: () => setFocusMode((prev) => !prev),
    }),
    [focusMode]
  );

  return (
    <FocusModeContext.Provider value={value}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within FocusModeProvider");
  }
  return context;
};
