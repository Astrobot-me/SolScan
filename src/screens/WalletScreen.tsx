// import { StatusBar } from 'expo-status-bar';
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Linking,
    SafeAreaView,



} from 'react-native';
import { s } from "../styles/styles"
import { useState } from 'react';

const RPC = "https://api.mainnet-beta.solana.com";


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

const short_txn_sig = (sig: string, count: number) => `${sig.slice(0, count)}....${sig.slice(-count)}`


const timeAgo = (ts: number) => {
    const s = Math.floor(Date.now() / 1000 - ts);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};





export function WalletScreen() {

    const [address, setAddress] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [balance, setBalence] = useState<number | null>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [txns, setTxns] = useState<any[]>([]);


    const search = async () => {

        const add = address.trim()
        if (!add) return Alert.alert("Enter a wallet address");

        setLoading(true)
        try {
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

    const tryExample = () => {
        const example = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
        setAddress(example);
    };


    return (




        <ScrollView style={s.scroll}>

            <Text style={s.title}>SolScan</Text>
            <Text style={s.subtitle}>Explore any Solana wallet</Text>

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
                    onPress={tryExample}
                    activeOpacity={0.7}
                >
                    <Text style={s.btnGhostText} >Demo</Text>
                </TouchableOpacity>
            </View>

            {
                balance != null && (
                    <View style={s.card}>
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


    );
}

