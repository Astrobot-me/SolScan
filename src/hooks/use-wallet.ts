import { StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import {transact, type Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { 

    Connection, 
    PublicKey, 
    Transaction ,
    SystemProgram ,
    clusterApiUrl, 
    LAMPORTS_PER_SOL

 } from '@solana/web3.js'
import { useWalletStore } from '@/store/wallet-store';
// import from 'expo-crypto'


const APP_IDENTITY = {
     uri: "",
    icon: "",
    name: ""
}


export default function useWallet() {

    const [publicKey , setPubKey ] = useState<PublicKey | null>(null); 
    const [conneting , setConnecting ] = useState<boolean>(false); 
    const [sending , setSending ] = useState<boolean>(false); 
    const isDevnet = useWalletStore(state => state.isDevnet)

    const cluster = !isDevnet ? "mainnet-beta" : "devnet"; 

    const connection = new Connection(clusterApiUrl(cluster), "confirmed"); 

    const connect = useCallback(async () => { 

        setConnecting(true)
        try {
            
            const authres = await transact((wallet : Web3MobileWallet) =>  {

                const result = wallet.authorize({
                    chain: `solana:${cluster}`, 
                    identity: APP_IDENTITY
                })

                return result;  
            })

            const pubkey = new PublicKey(Buffer.from(authres.accounts[0].address, "base64"))
            setPubKey(pubkey)

        } catch (error) {
            console.log("Error Occured", error)
            throw error; 

        }finally { 
            setConnecting(false)
        }

    }, [cluster])

    const disconnect = useCallback(async () => {
        setPubKey(null)
    }, [cluster])

    const getBalence = useCallback( async () => {
        
        if (!publicKey) return;
        const balence = await connection.getBalance(publicKey)

        return balence / LAMPORTS_PER_SOL;
    },[publicKey])



    return {

    }
}

const styles = StyleSheet.create({})