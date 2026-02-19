import { View, Text, TouchableOpacity , StyleSheet } from 'react-native'
import React from 'react'
import { useWallet } from '@/store/wallet-store'
import { Ionicons } from '@expo/vector-icons';



type FavProps = { 
    address : string; 
}

const FavoriteButton = ({address} : FavProps) => {
    const addToFav = useWallet(state => state.addFavorite)
    //  fn to call
    const isFavorite = useWallet(state => state.isFavorite)
    const removeFavorite = useWallet(state => state.removeFavorite)
    //boolean value 
    const isFav = isFavorite(address) 
    return (
        <TouchableOpacity 
        style={s.button}
        onPress={() =>{ 
            if(isFav) {
                removeFavorite(address)
            } else { 
                addToFav(address)
            }
        }}
        >
            <Ionicons 
            name={isFav  ? "heart-circle" : "heart-circle-outline"} 
            size={24}
            color={isFav ? "#fa3636" : "#666"}
            />

        </TouchableOpacity>
    )
}


const s = StyleSheet.create({ 
    button :{ 
        padding:8
    }
})
export default FavoriteButton