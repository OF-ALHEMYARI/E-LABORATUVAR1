import { db } from '../config/firebaseConfig';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import FirebaseErrorHandler from './firebaseErrorHandler';

class FirebaseMigration {
  constructor() {
    this.db = db;
    this.batchSize = 500; // Firestore batch limit is 500
    this.migrationProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };
  }

  async migrateData(mysqlData, collectionName, options = {}) {
    try {
      this.migrationProgress = {
        total: mysqlData.length,
        completed: 0,
        failed: 0,
        startTime: new Date(),
        endTime: null
      };

      const batches = this.createBatches(mysqlData, this.batchSize);
      const results = [];

      for (const batch of batches) {
        try {
          const result = await this.processBatch(batch, collectionName, options);
          results.push(result);
          this.migrationProgress.completed += batch.length;
        } catch (error) {
          this.migrationProgress.failed += batch.length;
          console.error(`Batch migration failed:`, error);
        }
      }

      this.migrationProgress.endTime = new Date();
      return {
        success: this.migrationProgress.failed === 0,
        progress: this.migrationProgress,
        results
      };
    } catch (error) {
      throw FirebaseErrorHandler.handleError(error, 'migration');
    }
  }

  createBatches(data, batchSize) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  async processBatch(batchData, collectionName, options) {
    const batch = writeBatch(this.db);
    const processedIds = [];

    for (const item of batchData) {
      try {
        const docId = options.idField ? item[options.idField] : doc(collection(this.db, collectionName)).id;
        const docRef = doc(this.db, collectionName, docId);
        
        const processedData = this.processDataForFirestore(item, options);
        batch.set(docRef, processedData, { merge: options.merge || false });
        
        processedIds.push(docId);
      } catch (error) {
        console.error(`Error processing item:`, error);
        this.migrationProgress.failed += 1;
      }
    }

    await batch.commit();
    return processedIds;
  }

  processDataForFirestore(data, options) {
    const processed = { ...data };

    // Remove MySQL-specific fields if any
    if (options.excludeFields) {
      options.excludeFields.forEach(field => {
        delete processed[field];
      });
    }

    // Convert Date objects to Firestore Timestamps
    Object.keys(processed).forEach(key => {
      if (processed[key] instanceof Date) {
        processed[key] = new Date(processed[key]);
      }
    });

    // Add metadata if specified
    if (options.addMetadata) {
      processed.metadata = {
        migratedAt: new Date(),
        source: 'mysql',
        version: '1.0'
      };
    }

    return processed;
  }

  async migrateRelationships(relationships, options = {}) {
    try {
      const results = [];
      
      for (const relationship of relationships) {
        const {
          sourceCollection,
          sourceId,
          targetCollection,
          targetId,
          relationshipType
        } = relationship;

        const sourceRef = doc(this.db, sourceCollection, sourceId);
        const targetRef = doc(this.db, targetCollection, targetId);

        switch (relationshipType) {
          case 'oneToOne':
            await setDoc(sourceRef, { 
              [targetCollection]: targetRef 
            }, { merge: true });
            break;

          case 'oneToMany':
            await setDoc(sourceRef, {
              [`${targetCollection}s`]: [targetRef]
            }, { merge: true });
            break;

          case 'manyToMany':
            const relationshipCollection = `${sourceCollection}_${targetCollection}`;
            const relationshipRef = doc(collection(this.db, relationshipCollection));
            await setDoc(relationshipRef, {
              [sourceCollection]: sourceRef,
              [targetCollection]: targetRef,
              createdAt: new Date()
            });
            break;
        }

        results.push({
          success: true,
          relationship
        });
      }

      return results;
    } catch (error) {
      throw FirebaseErrorHandler.handleError(error, 'relationship_migration');
    }
  }

  async validateMigration(mysqlData, collectionName, options = {}) {
    try {
      const validationResults = {
        total: mysqlData.length,
        validated: 0,
        failed: 0,
        mismatches: []
      };

      for (const item of mysqlData) {
        const docId = options.idField ? item[options.idField] : null;
        if (!docId) continue;

        const docRef = doc(this.db, collectionName, docId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
          validationResults.failed++;
          validationResults.mismatches.push({
            id: docId,
            error: 'Document not found in Firestore'
          });
          continue;
        }

        const firestoreData = docSnapshot.data();
        const processedMysqlData = this.processDataForFirestore(item, options);

        const differences = this.compareData(processedMysqlData, firestoreData);
        
        if (differences.length > 0) {
          validationResults.failed++;
          validationResults.mismatches.push({
            id: docId,
            differences
          });
        } else {
          validationResults.validated++;
        }
      }

      return validationResults;
    } catch (error) {
      throw FirebaseErrorHandler.handleError(error, 'migration_validation');
    }
  }

  compareData(source, target) {
    const differences = [];

    Object.keys(source).forEach(key => {
      if (key === 'metadata') return; // Skip metadata comparison

      if (source[key] instanceof Date) {
        if (!target[key] || source[key].getTime() !== target[key].toDate().getTime()) {
          differences.push({
            field: key,
            sourceValue: source[key],
            targetValue: target[key]
          });
        }
      } else if (JSON.stringify(source[key]) !== JSON.stringify(target[key])) {
        differences.push({
          field: key,
          sourceValue: source[key],
          targetValue: target[key]
        });
      }
    });

    return differences;
  }

  getMigrationProgress() {
    return {
      ...this.migrationProgress,
      percentComplete: this.migrationProgress.total > 0 
        ? (this.migrationProgress.completed / this.migrationProgress.total) * 100 
        : 0,
      duration: this.migrationProgress.endTime 
        ? this.migrationProgress.endTime - this.migrationProgress.startTime 
        : null
    };
  }

  async rollbackMigration(collectionName, docIds) {
    try {
      const batch = writeBatch(this.db);
      
      for (const docId of docIds) {
        const docRef = doc(this.db, collectionName, docId);
        batch.delete(docRef);
      }

      await batch.commit();
      return true;
    } catch (error) {
      throw FirebaseErrorHandler.handleError(error, 'migration_rollback');
    }
  }
}

export const firebaseMigration = new FirebaseMigration();
