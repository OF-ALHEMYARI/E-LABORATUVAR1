import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { TextInput, Button, Text, Switch } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseAuthService } from "../services/firebaseAuthService";

const Registration = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  const handleRegistration = async () => {
    try {
      if (!username || !password || !confirmPassword || !email || !fullName) {
        Alert.alert("Error", "All fields are required");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      if (isAdmin && adminCode !== "admin2025") {
        Alert.alert("Error", "Invalid admin code");
        return;
      }
      const newUser = {
        username,
        password,
        email,
        fullName,
        isAdmin,
        createdAt: new Date().toISOString(),
      };
      await firebaseAuthService.registerUser(email, password, newUser);
      Alert.alert("Success", "Registration successful", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to register");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registration</Text>

      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      <View style={styles.adminSection}>
        <Text>Register as Admin</Text>
        <Switch value={isAdmin} onValueChange={setIsAdmin} />
      </View>

      {isAdmin && (
        <TextInput
          label="Admin Code"
          value={adminCode}
          onChangeText={setAdminCode}
          secureTextEntry
          style={styles.input}
        />
      )}

      <Button
        mode="contained"
        onPress={handleRegistration}
        style={styles.button}
      >
        Register
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate("Login")}
        style={styles.button}
      >
        Back to Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  adminSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
});

export default Registration;
