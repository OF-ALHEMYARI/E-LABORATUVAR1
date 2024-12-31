import { 
  collection,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  FieldValue,
  batch
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class FirebaseService {
  // Test Results
  async addTestResult(testData) {
    try {
      const testRef = await addDoc(collection(db, 'testResults'), {
        ...testData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return testRef.id;
    } catch (error) {
      console.error('Error adding test result:', error);
      throw error;
    }
  }

  async getTestResult(testId) {
    try {
      const testDoc = await getDoc(doc(db, 'testResults', testId));
      return testDoc.exists() ? { id: testDoc.id, ...testDoc.data() } : null;
    } catch (error) {
      console.error('Error getting test result:', error);
      throw error;
    }
  }

  async updateTestResult(testId, updateData) {
    try {
      await updateDoc(doc(db, 'testResults', testId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating test result:', error);
      throw error;
    }
  }

  // Patients
  async addPatient(patientData) {
    try {
      const patientRef = await addDoc(collection(db, 'patients'), {
        ...patientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return patientRef.id;
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  }

  async getPatient(patientId) {
    try {
      const patientDoc = await getDoc(doc(db, 'patients', patientId));
      return patientDoc.exists() ? { id: patientDoc.id, ...patientDoc.data() } : null;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  }

  async updatePatient(patientId, updateData) {
    try {
      await updateDoc(doc(db, 'patients', patientId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  // Reference Ranges
  async addReferenceRange(rangeData) {
    try {
      const rangeRef = await addDoc(collection(db, 'referenceRanges'), {
        ...rangeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return rangeRef.id;
    } catch (error) {
      console.error('Error adding reference range:', error);
      throw error;
    }
  }

  async getReferenceRanges() {
    try {
      const rangesSnapshot = await getDocs(collection(db, 'referenceRanges'));
      return rangesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting reference ranges:', error);
      throw error;
    }
  }

  // Queries
  async queryTestResults(filters = {}) {
    try {
      let q = query(collection(db, 'testResults'));
      const conditions = [];

      if (filters.patientId) {
        conditions.push(where('patientId', '==', filters.patientId));
      }
      if (filters.testType) {
        conditions.push(where('testType', '==', filters.testType));
      }
      if (filters.startDate) {
        conditions.push(where('createdAt', '>=', filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(where('createdAt', '<=', filters.endDate));
      }
      if (filters.status) {
        conditions.push(where('status', '==', filters.status));
      }

      conditions.push(orderBy('createdAt', 'desc'));

      if (filters.limit) {
        conditions.push(limit(filters.limit));
      }
      if (filters.lastDoc) {
        conditions.push(startAfter(filters.lastDoc));
      }

      q = conditions.reduce((acc, curr) => acc = curr, q);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error querying test results:', error);
      throw error;
    }
  }

  // Real-time Updates
  subscribeToTestResults(patientId, callback) {
    try {
      const q = query(collection(db, 'testResults'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(results);
      });
    } catch (error) {
      console.error('Error subscribing to test results:', error);
      throw error;
    }
  }

  // Batch Operations
  async batchAddTestResults(testResults) {
    try {
      const batch = batch(db);
      const timestamp = serverTimestamp();

      testResults.forEach(testData => {
        const testRef = doc(collection(db, 'testResults'));
        batch.set(testRef, {
          ...testData,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error batch adding test results:', error);
      throw error;
    }
  }

  // Statistics
  async getTestStatistics(filters = {}) {
    try {
      const q = query(collection(db, 'testResults'),
        where('createdAt', '>=', filters.startDate || new Date(0)),
        where('createdAt', '<=', filters.endDate || new Date()));

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => doc.data());

      return {
        totalTests: results.length,
        abnormalResults: results.filter(r => r.isAbnormal).length,
        testsByType: results.reduce((acc, curr) => {
          acc[curr.testType] = (acc[curr.testType] || 0) + 1;
          return acc;
        }, {}),
        averageValues: results.reduce((acc, curr) => {
          if (!acc[curr.testType]) {
            acc[curr.testType] = { sum: 0, count: 0 };
          }
          acc[curr.testType].sum += curr.value;
          acc[curr.testType].count += 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting test statistics:', error);
      throw error;
    }
  }

  // Data Export
  async exportTestResults(filters = {}) {
    try {
      const results = await this.queryTestResults(filters);
      return results.map(result => ({
        id: result.id,
        patientId: result.patientId,
        testType: result.testType,
        value: result.value,
        unit: result.unit,
        referenceRange: result.referenceRange,
        isAbnormal: result.isAbnormal,
        notes: result.notes,
        createdAt: result.createdAt?.toDate?.(),
        updatedAt: result.updatedAt?.toDate?.()
      }));
    } catch (error) {
      console.error('Error exporting test results:', error);
      throw error;
    }
  }

  // Cleanup
  async deleteOldTestResults(daysOld) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const q = query(collection(db, 'testResults'),
        where('createdAt', '<=', cutoffDate));

      const snapshot = await getDocs(q);
      const batch = batch(db);

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error deleting old test results:', error);
      throw error;
    }
  }

  // Search functions for CombinedResultsSearch
  async searchPatients(searchQuery) {
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(
        patientsRef,
        orderBy('firstName'),
        startAt(searchQuery),
        endAt(searchQuery + '\uf8ff'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async searchTestResults(searchQuery) {
    try {
      const resultsRef = collection(db, 'testResults');
      const q = query(
        resultsRef,
        orderBy('testType'),
        startAt(searchQuery),
        endAt(searchQuery + '\uf8ff'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching test results:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
