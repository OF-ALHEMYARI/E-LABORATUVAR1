import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0891b2",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "white",
        },
        headerTitleStyle: {
          color: "#0f172a",
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="(home)/index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
          headerTitle: "E-Laboratuvar",
        }}
      />

      <Tabs.Screen
        name="tests/index"
        options={{
          title: "Testler",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="science" size={size} color={color} />
          ),
          headerTitle: "Testler",
        }}
      />

      <Tabs.Screen
        name="report/index"
        options={{
          title: "Rapor",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assessment" size={size} color={color} />
          ),
          headerTitle: "Kapsamlı Rapor",
        }}
      />

      <Tabs.Screen
        name="(history)/index"
        options={{
          title: "Geçmiş",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
          headerTitle: "Test Geçmişi",
        }}
      />

      <Tabs.Screen
        name="(profile)/index"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
          headerTitle: "Profilim",
        }}
      />
    </Tabs>
  );
}
