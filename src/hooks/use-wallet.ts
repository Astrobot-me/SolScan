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
	name: "SolScan",
	uri: "https://solscan-app.com",
	icon: "favicon.ico",
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
			console.log("[useWallet] sendSOL() called");
			console.log("[useWallet] to:", toAddress, "amount:", amountSOL);

			if (!publicKey) {
				throw new Error("Wallet not connected");
			}

			setSending(true);

			try {
				// step 1: get blockhash
				console.log("[useWallet] fetching blockhash...");
				const { blockhash, lastValidBlockHeight } =
					await connection.getLatestBlockhash();
				console.log("[useWallet] blockhash:", blockhash);

				// step 2: build transaction
				const toPublicKey = new PublicKey(toAddress);
				const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);
				console.log("[useWallet] lamports:", lamports);

				const transaction = new Transaction();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = publicKey;
				transaction.add(
					SystemProgram.transfer({
						fromPubkey: publicKey,
						toPubkey: toPublicKey,
						lamports,
					}),
				);
				console.log("[useWallet] transaction built");

				// step 3: sign transaction inside transact (shows wallet popup)
				console.log("[useWallet] starting transact for signing...");

				const signedTransaction = await transact(
					async (wallet: Web3MobileWallet) => {
						console.log(
							"[useWallet] inside transact, calling authorize...",
						);

						await wallet.authorize({
							cluster: cluster,
							identity: APP_IDENTITY,
						});
						console.log(
							"[useWallet] authorized, calling signTransactions...",
						);

						const signedTxs = await wallet.signTransactions({
							transactions: [transaction],
						});
						console.log("[useWallet] signTransactions completed");

						if (!signedTxs || signedTxs.length === 0) {
							throw new Error(
								"No signed transaction returned from wallet",
							);
						}

						return signedTxs[0];
					},
				);

				console.log(
					"[useWallet] transaction signed, waiting before send...",
				);

				// step 4: delay after phantom closes (network reconnect)
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// step 5: send transaction with retry logic
				const rawTransaction = signedTransaction.serialize();
				console.log("[useWallet] serialized, sending to network...");

				let signature: string | null = null;
				let lastError: Error | null = null;

				for (let attempt = 1; attempt <= 3; attempt++) {
					try {
						console.log(`[useWallet] send attempt ${attempt}...`);
						signature = await connection.sendRawTransaction(
							rawTransaction,
							{
								skipPreflight: true,
								maxRetries: 2,
							},
						);
						console.log("[useWallet] sent, signature:", signature);
						break;
					} catch (err: unknown) {
						lastError = err as Error;
						console.log(
							`[useWallet] attempt ${attempt} failed:`,
							lastError.message,
						);
						if (attempt < 3) {
							await new Promise((resolve) =>
								setTimeout(resolve, 1000),
							);
						}
					}
				}

				if (!signature) {
					throw (
						lastError ||
						new Error("Failed to send transaction after 3 attempts")
					);
				}

				// step 6: confirm transaction
				console.log("[useWallet] confirming transaction...");
				const confirmation = await connection.confirmTransaction(
					{
						signature,
						blockhash,
						lastValidBlockHeight,
					},
					"confirmed",
				);

				if (confirmation.value.err) {
					throw new Error(
						`Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
					);
				}

				console.log("[useWallet] transaction confirmed!");
				return signature;
			} catch (error) {
				console.error("[useWallet] sendSOL error:", error);
				throw error;
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
