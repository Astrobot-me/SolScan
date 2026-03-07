import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, TextInput, Platform, Linking } from 'react-native'
import React, { useState } from 'react'
import useWallet from '@/hooks/use-wallet';
import { useWalletStore } from '@/store/wallet-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function send() {


    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState("")

    const isDevnet = useWalletStore(state => state.isDevnet)
    const connectedPubKey = useWalletStore(state => state.connectedPubKey)
    const router = useRouter();
    const wallet = useWallet();


    const handleSendSol = async () => {

        if (!amount.trim() || isNaN(Number(amount)) || Number(amount) < 0) Alert.alert("Amount is required", "Please enter a valid amount > 0")
        if (!address.trim()) Alert.alert("Address is required", "Please enter a valid Address")

        try {
            const sig = await wallet.sendSOL(address, Number(amount));

            const baseUrl = "https://solscan.io/tx"
            const clusterparam = isDevnet ? "?cluster=devnet" : "";

            Alert.alert("Transaction Successful" , 

                `Sent ${amount} to ${address.slice(0,10)}...`, 
                [
                    {
                        text:"View on SolScan", 
                        onPress : () => Linking.openURL(`${baseUrl}/${sig}${clusterparam}`)
                    } , 
                    {
                        text:"Done", 
                        onPress: () => router.back() 
                    }
                ]
            )



        } catch (error: any) {
            const message = error.message;
            console.log(`Some Error Occured : ${message}`);
            Alert.alert(`Some Error Occured : ${message}`);
        }




    }

    if (!connectedPubKey) {
        return (
            <View style={styles.center}>
                <Ionicons name="wallet-outline" size={64} color="#333" />
                <Text style={styles.emptyTitle}>Wallet Not Connected</Text>
                {/* <Text style={styles.emptyTitle}>{connectedPubKey.toBase58()}</Text> */}
                <Text style={styles.emptyText}>
                    Connect your wallet from the Explorer tab first.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Send SOL</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardLabel}>From</Text>
                <Text style={styles.cardAddress}>
                    {wallet.publicKey?.toBase58().slice(0, 8)}...
                    {wallet.publicKey?.toBase58().slice(-4)}
                </Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Paste Solana address..."
                    placeholderTextColor="#555"
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (SOL)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.0"
                    placeholderTextColor="#555"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                />
            </View>

            <TouchableOpacity
                style={[styles.sendButton, wallet.sending && styles.sendButtonDisabled]}
                onPress={handleSendSol}
                disabled={wallet.sending}
            >
                {wallet.sending ? (
                    <ActivityIndicator color="#0a0a1a" />
                ) : (
                    <Text style={styles.sendButtonText}>Send SOL</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.feeText}>Network fee: ~0.000005 SOL ($0.001)</Text>
        </KeyboardAvoidingView>

    )

}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0D0D12",
        padding: 16,
        paddingTop: 60,
    },
    center: {
        flex: 1,
        backgroundColor: "#0D0D12",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        marginTop: 16,
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    title: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },
    card: {
        backgroundColor: "#16161D",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#2A2A35",
    },
    cardLabel: {
        color: "#6B7280",
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    cardAddress: {
        color: "#9945FF",
        fontSize: 14,
        fontFamily: "monospace",
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: "#6B7280",
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#16161D",
        color: "#fff",
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#2A2A35",
    },
    sendButton: {
        backgroundColor: "#14F195",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: "#0D0D12",
        fontSize: 18,
        fontWeight: "700",
    },
    feeText: {
        color: "#6B7280",
        fontSize: 12,
        textAlign: "center",
        marginTop: 12,
    },
    backButton: {
        backgroundColor: "#9945FF",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
    },
    backButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
});