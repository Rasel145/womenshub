import { create } from "zustand";
import { getWishlistIds, setWishlisted } from "@/app/actions/wishlist";

interface WishlistState {
  ids: string[];
  loggedIn: boolean | null; // null = not known yet
  loaded: boolean;
  acquire: () => void;
  release: () => void;
  toggle: (productId: string) => Promise<"login" | "added" | "removed" | "error">;
}

// Counts how many heart buttons are on the screen. When the last one goes away the
// saved list is dropped, so the next page always loads a fresh list. This also
// handles login, logout and expired sessions without any extra code.
let mounted = 0;
let loading = false;

export const useWishlist = create<WishlistState>((set, get) => ({
  ids: [],
  loggedIn: null,
  loaded: false,

  acquire: () => {
    mounted += 1;
    if (get().loaded || loading) return;

    loading = true;
    getWishlistIds()
      .then((data) => {
        if (mounted > 0) set({ ids: data.ids, loggedIn: data.loggedIn, loaded: true });
      })
      .catch(() => {})
      .finally(() => {
        loading = false;
      });
  },

  release: () => {
    mounted = Math.max(0, mounted - 1);
    if (mounted === 0) set({ ids: [], loggedIn: null, loaded: false });
  },

  toggle: async (productId) => {
    const { loggedIn, ids } = get();
    if (loggedIn === false) return "login";

    // Update the heart immediately, then save in the background
    const wanted = !ids.includes(productId);
    set({ ids: wanted ? [...ids, productId] : ids.filter((id) => id !== productId) });

    const result = await setWishlisted(productId, wanted);

    if (!result.ok) {
      // Undo
      set((state) => ({
        ids: wanted
          ? state.ids.filter((id) => id !== productId)
          : [...state.ids, productId],
      }));
      if (result.error === "login") {
        set({ loggedIn: false, ids: [] });
        return "login";
      }
      return "error";
    }

    return wanted ? "added" : "removed";
  },
}));