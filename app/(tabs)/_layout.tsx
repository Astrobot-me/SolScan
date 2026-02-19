// app/(tabs)/_layout.tsx
// tab layout - defines bottom tab navigation
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // hide the header - we'll add our own in each screen
        headerShown: false,
        // tab bar styling
        tabBarStyle: {
          backgroundColor: "#16161D",
          borderTopColor: "#2A2A35",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 12,
          height: 70,
        },
        // active/inactive colors
        tabBarActiveTintColor: "#5ca7fb",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      {/* each Tab.Screen corresponds to a file in (tabs) folder */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: "Swap",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}