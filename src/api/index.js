import axios from "axios";

const API_URL = "http://192.168.1.105:3000"; // دعم المتغيرات البيئية مع عنوان افتراضي

// وظائف المستخدم
export const fetchTests = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/tests`, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
};

export const searchTests = async (userId, query) => {
  try {
    const response = await axios.get(`${API_URL}/users/tests/search`, {
      params: { userId, query },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching tests:", error);
    throw error;
  }
};

export const fetchReferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/references`);
    return response.data;
  } catch (error) {
    console.error("Error fetching references:", error);
    throw error;
  }
};

// وظائف المسؤول
export const createGuide = async (guideData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/guides`, guideData);
    return response.data;
  } catch (error) {
    console.error("Error creating guide:", error);
    throw error;
  }
};

export const fetchGuides = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/guides`);
    return response.data;
  } catch (error) {
    console.error("Error fetching guides:", error);
    throw error;
  }
};

// وظائف تحليل النتائج حسب العمر
export const analyzeTestResult = async (testData) => {
  try {
    const response = await axios.get(`${API_URL}/admin/analyze-test`, {
      params: {
        patientId: testData.patientId,
        testType: testData.testType,
        value: testData.value,
        testDate: testData.testDate,
        guideName: testData.guideName
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error analyzing test result:", error);
    throw error;
  }
};

// وظائف إدارة المرضى
export const addPatient = async (patientData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/patients`, {
      name: patientData.name,
      birthDate: patientData.birthDate
    });
    return response.data;
  } catch (error) {
    console.error("Error adding patient:", error);
    throw error;
  }
};

export const getPatientTests = async (patientId) => {
  try {
    const response = await axios.get(`${API_URL}/admin/patients/${patientId}/tests`);
    return response.data;
  } catch (error) {
    console.error("Error fetching patient tests:", error);
    throw error;
  }
};

// وظائف مقارنة النتائج
export const compareTestResults = async (patientId, testType) => {
  try {
    const response = await axios.get(`${API_URL}/admin/tests/compare`, {
      params: {
        patientId,
        testType
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error comparing test results:", error);
    throw error;
  }
};
