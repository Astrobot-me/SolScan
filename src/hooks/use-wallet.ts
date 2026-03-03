import { StyleSheet, Text, View } from "react-native";
import React, { useCallback, useState } from "react";
import {
	transact,
	type Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
	clusterApiUrl,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useWalletStore } from "@/store/wallet-store";
// import from 'expo-crypto'

const APP_IDENTITY = {
	uri: "",
	icon: "",
	name: "",
};

export default function useWallet() {
	const [publicKey, setPubKey] = useState<PublicKey | null>(null);
	const [connecting, setConnecting] = useState<boolean>(false);
	const [sending, setSending] = useState<boolean>(false);
	const isDevnet = useWalletStore((state) => state.isDevnet);

	const cluster = !isDevnet ? "mainnet-beta" : "devnet";

	const connection = new Connection(clusterApiUrl(cluster), "confirmed");

	const connect = useCallback(async () => { 
		setConnecting(true);
		try {
			const authres = await transact((wallet: Web3MobileWallet) => {
				const result = wallet.authorize({
					chain: `solana:${cluster}`,
					identity: APP_IDENTITY,
				});

				return result;
			});

			const pubkey = new PublicKey(
				Buffer.from(authres.accounts[0].address, "base64"),
			);
			setPubKey(pubkey);
		} catch (error) {
			console.log("Error Occured", error);
			throw error;
		} finally {
			setConnecting(false);
		}
	}, [cluster]);

	const disconnect = useCallback(async () => {
		setPubKey(null);
	}, [cluster]);

	const getBalance = useCallback(async () => {
		if (!publicKey) return;
		const balence = await connection.getBalance(publicKey);

		return balence / LAMPORTS_PER_SOL;
	}, [publicKey]);

	// ============================================
	// SEND SOL — Build, sign, and send a transaction
	// ============================================
	const sendSOL = useCallback(
		async (toAddress: string, amountSOL: number) => {
			if (!publicKey) throw new Error("Wallet not connected");

			setSending(true);
			try {
				// Step 1: Build the transaction
				const toPublicKey = new PublicKey(toAddress);
				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: publicKey,
						toPubkey: toPublicKey,
						lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
					}),
				);

				// Step 2: Get recent blockhash (needed for transaction)
				const { blockhash } = await connection.getLatestBlockhash();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = publicKey;

				// Step 3: Send to Phantom for signing + submission
				const txSignature = await transact(
					async (wallet: Web3MobileWallet) => {
						// Re-authorize (Phantom needs this each session)
						await wallet.authorize({
							chain: `solana:${cluster}`,
							identity: APP_IDENTITY,
						});

						// Sign and send — Phantom shows the transaction details
						// User approves → Phantom signs → sends to network
						const signatures = await wallet.signAndSendTransactions(
							{
								transactions: [transaction],
							},
						);

						return signatures[0];
					},
				);

				return txSignature;
			} finally {
				setSending(false);
			}
		},
		[publicKey, connection, cluster],
	);

	return {
		publicKey,
		connected: !!publicKey,
		connecting,
		sending,
		connect,
		disconnect,
		getBalance,
		sendSOL,
		connection,
	};
}

const styles = StyleSheet.create({});
