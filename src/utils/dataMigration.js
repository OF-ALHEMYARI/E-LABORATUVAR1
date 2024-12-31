const AsyncStorage = require('@react-native-async-storage/async-storage');
const DatabaseService = require('../services/databaseService');

class DataMigration {
  static async migratePatients() {
    try {
      // Get patients from AsyncStorage
      const patientsData = await AsyncStorage.getItem('patients');
      if (!patientsData) return;

      const patients = JSON.parse(patientsData);
      
      for (const patient of patients) {
        // Check if patient already exists in database
        const existingPatient = await DatabaseService.getPatientById(patient.patientId);
        if (existingPatient) continue;

        // Prepare patient data for database
        const patientData = {
          patient_id: patient.patientId,
          first_name: patient.firstName,
          last_name: patient.lastName,
          date_of_birth: patient.dateOfBirth,
          gender: patient.gender,
          contact_number: patient.contactNumber,
          email: patient.email,
          address: patient.address,
          medical_history: patient.medicalHistory,
          current_medications: patient.currentMedications,
          allergies: patient.allergies
        };

        // Create patient in database
        const patientId = await DatabaseService.createPatient(patientData);

        // Create emergency contact if exists
        if (patient.emergencyContact) {
          await DatabaseService.createEmergencyContact(patientId, patient.emergencyContact);
        }
      }

      console.log('Patient migration completed');
    } catch (error) {
      console.error('Error migrating patients:', error);
      throw error;
    }
  }

  static async migrateReferenceRanges() {
    try {
      // Get reference ranges from AsyncStorage
      const rangesData = await AsyncStorage.getItem('referenceGuides');
      if (!rangesData) return;

      const ranges = JSON.parse(rangesData);

      for (const range of ranges) {
        const [minAge, maxAge] = range.ageGroup.split('-').map(age => parseInt(age));

        const rangeData = {
          test_type: range.testType,
          min_age: minAge,
          max_age: maxAge,
          min_value: range.minValue,
          max_value: range.maxValue,
          unit: range.unit,
          gender: range.gender,
          description: range.description,
          source: range.source
        };

        await DatabaseService.createReferenceRange(rangeData);
      }

      console.log('Reference ranges migration completed');
    } catch (error) {
      console.error('Error migrating reference ranges:', error);
      throw error;
    }
  }

  static async migrateTestResults() {
    try {
      // Get test results from AsyncStorage
      const resultsData = await AsyncStorage.getItem('testResults');
      if (!resultsData) return;

      const results = JSON.parse(resultsData);

      for (const result of results) {
        const patient = await DatabaseService.getPatientById(result.patientId);
        if (!patient) continue;

        const testData = {
          patientId: patient.id,
          IgG: result.IgG,
          IgA: result.IgA,
          IgM: result.IgM,
          IgE: result.IgE,
          comments: result.comments,
          createdBy: result.createdBy
        };

        await DatabaseService.createTestResult(testData);
      }

      console.log('Test results migration completed');
    } catch (error) {
      console.error('Error migrating test results:', error);
      throw error;
    }
  }

  static async migrateAllData() {
    try {
      await this.migratePatients();
      await this.migrateReferenceRanges();
      await this.migrateTestResults();
      console.log('All data migration completed successfully');
    } catch (error) {
      console.error('Error during complete migration:', error);
      throw error;
    }
  }
}

module.exports = DataMigration;
