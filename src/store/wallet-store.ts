import { create } from "zustand";

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

export const useWallet = create<Wallet>((set, get) => ({
	favorites: [],
	searchHistory: [],
	isDevnet: false,

	addFavorite: (address: string) => {
		set((state) => ({
			favorites : state.favorites.includes(address)
				? state.favorites
				: [...state.favorites, address]
		}));
	},
	removeFavorite: (address: string) => {},
	isFavorite: (address: string) => {
		return false;
	},
	addToHistory: (address: string) => {},
	clearHistory: () => {},
	toggleNetwork: () => {},
}));
