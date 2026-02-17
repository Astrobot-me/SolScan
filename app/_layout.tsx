import {Stack} from 'expo-router'

import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const RootLayout = () => {
  return (
    <SafeAreaProvider>

        <Stack screenOptions={{ headerShown: false} }>

            <Stack.Screen name='(tabs)'/>
            <Stack.Screen name='token/[mint]'/>

        </Stack>
    </SafeAreaProvider>
  )
}

export default RootLayout