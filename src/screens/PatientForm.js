import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Card,
  Title,
  Divider,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAgeGroup } from "../constants/referenceRanges";
import { firebaseAuthService } from "../services/firebaseAuthService";

const PatientForm = ({ navigation }) => {
  const [formData, setFormData] = useState({
    patientId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    email: "",
    address: "",
    medicalHistory: "",
    currentMedications: "",
    allergies: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.patientId.trim())
      newErrors.patientId = "Patient ID is required";
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.dateOfBirth.trim())
      newErrors.dateOfBirth = "Date of birth is required";

    // Date of birth validation
    const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.dateOfBirth && !dobPattern.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Use format YYYY-MM-DD";
    }

    // Contact validation
    if (
      formData.contactNumber &&
      !/^\+?[\d\s-]{10,}$/.test(formData.contactNumber)
    ) {
      newErrors.contactNumber = "Invalid phone number";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Emergency contact validation
    if (
      formData.emergencyContact.phone &&
      !/^\+?[\d\s-]{10,}$/.test(formData.emergencyContact.phone)
    ) {
      newErrors.emergencyContactPhone = "Invalid emergency contact number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const age = calculateAge(formData.dateOfBirth);
      const ageGroup = getAgeGroup(age);

      const patientData = {
        ...formData,
        age,
        ageGroup,
        registrationDate: new Date().toISOString(),
      };

      // Get existing patients
      const existingData = await AsyncStorage.getItem("patients");
      const patients = existingData ? JSON.parse(existingData) : [];

      console.log("patients:", patients);
      // Check for duplicate patient ID
      if (patients.some((p) => p.patientId === patientData.patientId)) {
        setErrors({ patientId: "Patient ID already exists" });
        setLoading(false);
        return;
      }

      // Add new patient
      patients.push(patientData);
      await AsyncStorage.setItem("patients", JSON.stringify(patients));

      // Clear form
      setFormData({
        patientId: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        contactNumber: "",
        email: "",
        address: "",
        medicalHistory: "",
        currentMedications: "",
        allergies: "",
        emergencyContact: {
          name: "",
          relationship: "",
          phone: "",
        },
      });

      navigation.navigate("CombinedResultsSearch");
    } catch (error) {
      console.error("Error saving patient:", error);
      setErrors({ submit: "Failed to save patient data" });
    } finally {
      setLoading(false);
    }
  };
  function logout() {
    try {
      setLoading(true);
      firebaseAuthService.logoutUser();
      navigation.replace("Login");
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Patient Information</Title>
          <Divider style={styles.divider} />

          <TextInput
            label="Patient ID *"
            value={formData.patientId}
            onChangeText={(text) =>
              setFormData({ ...formData, patientId: text })
            }
            error={!!errors.patientId}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.patientId}>
            {errors.patientId}
          </HelperText>

          <TextInput
            label="First Name *"
            value={formData.firstName}
            onChangeText={(text) =>
              setFormData({ ...formData, firstName: text })
            }
            error={!!errors.firstName}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.firstName}>
            {errors.firstName}
          </HelperText>

          <TextInput
            label="Last Name *"
            value={formData.lastName}
            onChangeText={(text) =>
              setFormData({ ...formData, lastName: text })
            }
            error={!!errors.lastName}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.lastName}>
            {errors.lastName}
          </HelperText>

          <TextInput
            label="Date of Birth * (YYYY-MM-DD)"
            value={formData.dateOfBirth}
            onChangeText={(text) =>
              setFormData({ ...formData, dateOfBirth: text })
            }
            error={!!errors.dateOfBirth}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.dateOfBirth}>
            {errors.dateOfBirth}
          </HelperText>

          <TextInput
            label="Gender"
            value={formData.gender}
            onChangeText={(text) => setFormData({ ...formData, gender: text })}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Contact Information</Title>
          <Divider style={styles.divider} />

          <TextInput
            label="Contact Number"
            value={formData.contactNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, contactNumber: text })
            }
            error={!!errors.contactNumber}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.contactNumber}>
            {errors.contactNumber}
          </HelperText>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            error={!!errors.email}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Medical Information</Title>
          <Divider style={styles.divider} />

          <TextInput
            label="Medical History"
            value={formData.medicalHistory}
            onChangeText={(text) =>
              setFormData({ ...formData, medicalHistory: text })
            }
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <TextInput
            label="Current Medications"
            value={formData.currentMedications}
            onChangeText={(text) =>
              setFormData({ ...formData, currentMedications: text })
            }
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="Allergies"
            value={formData.allergies}
            onChangeText={(text) =>
              setFormData({ ...formData, allergies: text })
            }
            multiline
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Emergency Contact</Title>
          <Divider style={styles.divider} />

          <TextInput
            label="Name"
            value={formData.emergencyContact.name}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, name: text },
              })
            }
            style={styles.input}
          />

          <TextInput
            label="Relationship"
            value={formData.emergencyContact.relationship}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  relationship: text,
                },
              })
            }
            style={styles.input}
          />

          <TextInput
            label="Phone"
            value={formData.emergencyContact.phone}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, phone: text },
              })
            }
            error={!!errors.emergencyContactPhone}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.emergencyContactPhone}>
            {errors.emergencyContactPhone}
          </HelperText>
        </Card.Content>
      </Card>

      {errors.submit && <Text style={styles.errorText}>{errors.submit}</Text>}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        Save Patient
      </Button>
      <Button
        mode="contained"
        buttonColor="red"
        onPress={logout}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 10,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: "#B00020",
    marginBottom: 16,
    textAlign: "center",
  },
  submitButton: {
    marginVertical: 16,
    paddingVertical: 8,
  },
});

export default PatientForm;
