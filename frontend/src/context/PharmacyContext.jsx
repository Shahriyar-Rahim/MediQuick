import { createContext, useState } from "react";
import { pharmacies as initialData } from "../data/pharmacies";

export const PharmacyContext = createContext();

export function PharmacyProvider({ children }) {
  const [pharmacies, setPharmacies] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PharmacyContext.Provider
      value={{
        pharmacies,
        setPharmacies,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}