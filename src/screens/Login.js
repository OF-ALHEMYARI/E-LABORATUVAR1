import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseAuthService } from "../services/firebaseAuthService";

const Login = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const user = await firebaseAuthService.loginUser(username, password);
      if (user) {
        console.log(user.isAdmin);
        if (user) {
          if (user.isAdmin) {
            navigation.replace("AdminMenu");
          } else {
            navigation.replace("PatientForm");
          }
        } else {
          Alert.alert("Error", "Invalid username or password");
        }
      } else {
        Alert.alert("Error", "No registered users found");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to login");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-Laboratory System</Text>
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate("Registration")}
        style={styles.button}
      >
        Register
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
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
});

export default Login;
