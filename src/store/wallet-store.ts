import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/lib/storage";

interface Wallet {
	// Data
	favorites: string[]; // saved wallet addresses
	searchHistory: string[]; // recently searched addresses
	isDevnet: boolean; // devnet vs mainnet toggle

	// Actions
	addFavorite: (address: string) => void;
	removeFavorite: (address: string) => void;
	isFavorite: (address: string) => boolean;
	addToHistory: (address: string) => void;
	clearHistory: () => void;
	toggleNetwork: () => void;
}

export const useWalletStore = create<Wallet>()(
	persist(
		(set, get) => ({
			favorites: [],
			searchHistory: [],
			isDevnet: false,

			addFavorite: (address: string) => {
				set((state) => ({
					favorites: state.favorites.includes(address)
						? state.favorites
						: [...state.favorites, address],
				}));
			},
			removeFavorite: (address: string) => {
				set((state) => ({
					favorites: state.favorites.filter(
						(item) => item != address,
					),
				}));
			},
			isFavorite: (address: string) => {
				return get().favorites.includes(address);
			},
			addToHistory: (address: string) => {
				set((state) => ({
					searchHistory: state.searchHistory.includes(address)
						? state.searchHistory
						: [...state.searchHistory, address],
				}));
			},
			clearHistory: () => {
				set((state) => ({
					searchHistory: state.searchHistory.filter(
						(item) => item != state.searchHistory[0],
					),
				}));
			},
			toggleNetwork: () => {
				set((state) => ({
					isDevnet: !state.isDevnet,
				}));
			},
		}),
		{
			name: "wallet",
			storage: createJSONStorage(() => AsyncStorageAdapter),
		},
	),
);
