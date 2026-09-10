import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const UnitSystemContext = createContext(null);

const loadUnitSystem = () => {
  try {
    return localStorage.getItem("marine_unit_system") || "metric";
  } catch {
    return "metric";
  }
};

const formatNumber = (value, digits = 1) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const converters = {
  temperature: {
    metric: (value) => ({ value, unit: "°C" }),
    imperial: (value) => ({ value: value * 9 / 5 + 32, unit: "°F" }),
  },
  pressure: {
    metric: (value) => ({ value, unit: "bar" }),
    imperial: (value) => ({ value: value * 14.5038, unit: "psi" }),
  },
  flow: {
    metric: (value) => ({ value, unit: "L/h" }),
    imperial: (value) => ({ value: value * 0.264172, unit: "gal/h" }),
  },
  power: {
    metric: (value) => ({ value, unit: "kW" }),
    imperial: (value) => ({ value: value * 1.34102, unit: "hp" }),
  },
  distance: {
    metric: (value) => ({ value, unit: "m" }),
    imperial: (value) => ({ value: value * 3.28084, unit: "ft" }),
  },
};

export const UnitSystemProvider = ({ children }) => {
  const [unitSystem, setUnitSystemState] = useState(loadUnitSystem);

  useEffect(() => {
    try {
      localStorage.setItem("marine_unit_system", unitSystem);
    } catch {
      // localStorage may be unavailable in embedded views.
    }
  }, [unitSystem]);

  const setUnitSystem = (next) => {
    setUnitSystemState(next === "imperial" ? "imperial" : "metric");
  };

  const value = useMemo(() => {
    const convert = (type, rawValue) => {
      const converter = converters[type]?.[unitSystem];
      return converter ? converter(Number(rawValue) || 0) : { value: rawValue, unit: "" };
    };

    const formatUnit = (type, rawValue, digits = 1) => {
      const converted = convert(type, rawValue);
      return {
        value: formatNumber(converted.value, digits),
        unit: converted.unit,
        text: `${formatNumber(converted.value, digits)} ${converted.unit}`,
      };
    };

    return {
      unitSystem,
      setUnitSystem,
      isMetric: unitSystem === "metric",
      formatUnit,
      convert,
    };
  }, [unitSystem]);

  return (
    <UnitSystemContext.Provider value={value}>
      {children}
    </UnitSystemContext.Provider>
  );
};

export const useUnitSystem = () => {
  const context = useContext(UnitSystemContext);
  if (!context) {
    throw new Error("useUnitSystem must be used within UnitSystemProvider");
  }
  return context;
};
