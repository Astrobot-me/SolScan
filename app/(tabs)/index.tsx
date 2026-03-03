// import { StatusBar } from 'expo-status-bar';
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    Alert,
    Linking,

} from 'react-native';
import { s } from "@/styles/styles"
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import FavoriteButton from '@/components/FavoriteButton';
import { ConnectButton } from '@/components/ConnectionButton';
import useWallet from '@/hooks/use-wallet';


const short_txn_sig = (sig: string, count: number) => `${sig.slice(0, count)}....${sig.slice(-count)}`


const timeAgo = (ts: number) => {
    const s = Math.floor(Date.now() / 1000 - ts);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};





export default function WalletScreen() {

    const [address, setAddress] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [balance, setBalence] = useState<number | null>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [txns, setTxns] = useState<any[]>([]);

    const searchHistory = useWalletStore(state => state.searchHistory)
    const isDevnet = useWalletStore(state => state.isDevnet)
    const isFavorite = useWalletStore(state => state.isFavorite)
    const addToFavorite = useWalletStore(state => state.addFavorite)
    const addToHistory = useWalletStore(state => state.addToHistory)
    const toggleNetwork = useWalletStore(state => state.toggleNetwork)
    const wallet = useWallet(); 

    const RPC = isDevnet ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";


    async function rpc_call(method: string, params: any[]) {


        const res = await fetch(RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })

        })



        const data = await res.json();
        // console.log("data", data)
        if (data.error) throw new Error(data.error.message);
        return data.result;

    }

    async function getTokens(sig: string) {
        try {
            const result = await rpc_call("getTokenAccountsByOwner", [
                sig,
                { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
                { encoding: "jsonParsed", },
                // {limit : 10}
            ]);
            return (result.value || [])
                .map((a: any) => ({
                    mint: a.account.data.parsed.info.mint,
                    amount: a.account.data.parsed.info.tokenAmount.uiAmount,
                }))
                .filter((t: any) => t.amount > 0);
        } catch (error) {

        }
    }

    async function getBalance(sig: string) {

        try {
            const bal = await rpc_call("getBalance", [sig]);
            return bal.value / 1_000_000_000;
        } catch (error) {
            return 400
        }

    };


    async function getTransactions(sig: string) {
        try {
            const transactions = await rpc_call("getSignaturesForAddress", [sig, { limit: 10 }])
            return transactions.map((item: any) => {
                return {
                    sig: item.signature,
                    time: item.blockTime,
                    ok: !item.err,

                }
            })
        } catch (error) {

        }
    }


    const search = async () => {

        const add = address.trim()
        if (!add) return Alert.alert("Enter a wallet address");

        setLoading(true)
        try {
            addToHistory(address)
            const [bal, txns, tokens] = await Promise.all([
                getBalance(address),
                getTransactions(address),
                getTokens(address)
            ])

            setBalence(bal)
            setTxns(txns)
            setTokens(tokens)
        } catch (error: any) {
            Alert.alert("Erroc Occured", error?.message)
        } finally {
            setLoading(false)
        }


    }

    const searchFromHistory = async (address: string) => {
        clear()
        setLoading(true);
        setAddress(address);
        addToHistory(address)
        try {
            const [bal, txn, token] = await Promise.all([

                getBalance(address),
                getTransactions(address),
                getTokens(address)
            ])

            setBalence(bal)
            setTxns(txn)
            setTokens(token)

        } catch (error: any) {
            Alert.alert("Error", error?.message)
        }
        finally {
            setLoading(false)
        }
    }

    const tryExample = () => {
        const example = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
        setAddress(example);
    };


    const clear = () => {
        setAddress("");
        setBalence(null);
        setTokens([])
        setTxns([])
    }

    return (




        <SafeAreaView style={s.safe} edges={['top']}>
            <ScrollView style={s.scroll}>

                <View style={s.header}>
                    <View>
                        <Text style={s.title}>SolScan</Text>
                        <Text style={s.subtitle}>Explore any Solana wallet</Text>
                    </View>
                    <View style={s.headerRight}>
                        <TouchableOpacity style={s.networkToggle} onPress={toggleNetwork}>
                            <View style={[s.networkDot, isDevnet && s.networkDotDevnet]} />
                            <Text style={s.networkText}>
                                {isDevnet ? "Devnet" : "Mainnet"}
                            </Text>
                        </TouchableOpacity>
                        ? <ConnectButton
                            connected={wallet.connected}
                            connecting={wallet.connecting}
                            publicKey={wallet.publicKey?.toBase58() ?? null}
                            onConnect={wallet.connect}
                            onDisconnect={wallet.disconnect}
                        />
                    </View>
                </View>

                <View style={s.inputContainer} >
                    <TextInput
                        style={s.input}
                        placeholder="Enter wallet address..."
                        placeholderTextColor="#6B7280"
                        value={address}
                        onChangeText={setAddress}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={s.btnRow}>
                    <TouchableOpacity
                        style={[s.btn, loading && s.btnDisabled]}
                        onPress={search}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={s.btnText}>Search</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.btnGhost}
                        onPress={clear}
                        activeOpacity={0.7}
                    >
                        <Text style={s.btnGhostText} >Clear</Text>
                    </TouchableOpacity>
                </View>

                {searchHistory.length > 0 && balance === null && (
                    <View style={s.historySection}>
                        <Text style={s.historyTitle}>Recent Searches</Text>
                        {searchHistory.slice(0, 5).map((addr) => (
                            <TouchableOpacity
                                key={addr}
                                style={s.historyItem}
                                onPress={() => searchFromHistory(addr)}
                            >
                                <Ionicons name="time-outline" size={16} color="#6B7280" />
                                <Text style={s.historyAddress} numberOfLines={1}>
                                    {short_txn_sig(addr, 8)}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {
                    balance != null && (
                        <View style={s.card}>
                            <View style={s.favWrapper}>
                                <FavoriteButton address={address} />
                            </View>
                            <Text style={s.label}>SOL Balance</Text>
                            <View style={s.balanceRow}>
                                <Text style={s.balance}>{balance.toFixed(4)}</Text>
                                <Text style={s.sol}>SOL</Text>
                            </View>
                            <Text style={s.addr}>{short_txn_sig(address.trim(), 6)}</Text>
                        </View>
                    )
                }

                {/* Transaction List */}

                {
                    txns && txns.length > 0 && (

                        <>


                            <FlatList
                                data={txns}
                                keyExtractor={(t) => t.sig}
                                scrollEnabled={false}
                                ListHeaderComponent={<Text style={s.section}>Recent Transactions</Text>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={s.row}
                                        onPress={() => Linking.openURL(`https://solscan.io/tx/${item.sig}`)}
                                        activeOpacity={0.7}
                                    >
                                        <View>
                                            <Text style={s.mint}>{short_txn_sig(item.sig, 8)}</Text>
                                            <Text style={s.time}>
                                                {item.time ? timeAgo(item.time) : "pending"}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                s.statusIcon,
                                                { color: item.ok ? "#5ca7fb" : "#EF4444" },
                                            ]}
                                        >
                                            {item.ok ? "+" : "-"}
                                        </Text>


                                    </TouchableOpacity>
                                )}
                            >

                            </FlatList>
                        </>
                    )
                }

                {/* Owned Tokens */}

                {tokens && tokens.length > 0 && (
                    <>

                        <FlatList
                            data={tokens.slice(0, 5)}
                            keyExtractor={(t) => t.mint}
                            scrollEnabled={true}
                            ListHeaderComponent={<Text style={s.section}>Tokens ({tokens.length})</Text>}
                            renderItem={({ item }) => (
                                <View style={s.row}>
                                    <Text style={s.mint}>{short_txn_sig(item.mint, 6)}</Text>
                                    <Text style={s.amount}>{item.amount}</Text>
                                </View>
                            )}
                        />
                    </>
                )}
            </ScrollView>

        </SafeAreaView>

    );
}

