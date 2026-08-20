import { create } from "zustand";

export type SyncStatus = "local" | "cargando" | "ok" | "error";

export const useSyncStatus = create<{
  status: SyncStatus;
  setStatus: (s: SyncStatus) => void;
}>((set) => ({
  status: "local",
  setStatus: (status) => set({ status }),
}));
