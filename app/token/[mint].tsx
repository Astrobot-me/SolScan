import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'


const Mint = () => {

    const mint = useLocalSearchParams(); 
    // token/ijhfiehfewihri9wefkengioewhg93203
    return (
        <SafeAreaView>
            <View>
                <Text>Mint</Text>
            </View>
        </SafeAreaView>
    )
}

export default Mint