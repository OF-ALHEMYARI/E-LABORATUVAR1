import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  updateMetadata
} from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

class FirebaseStorageService {
  // Upload File
  async uploadFile(file, path, metadata = {}) {
    try {
      const storageRef = ref(storage, path);
      const result = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(result.ref);
      
      return {
        path: result.ref.fullPath,
        downloadURL,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Download File URL
  async getFileDownloadURL(path) {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file download URL:', error);
      throw error;
    }
  }

  // Delete File
  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // List Files in Directory
  async listFiles(path) {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => ({
          name: itemRef.name,
          path: itemRef.fullPath,
          downloadURL: await getDownloadURL(itemRef)
        }))
      );

      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Update File Metadata
  async updateFileMetadata(path, metadata) {
    try {
      const storageRef = ref(storage, path);
      const updatedMetadata = await updateMetadata(storageRef, metadata);
      return updatedMetadata;
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  }

  // Upload Multiple Files
  async uploadMultipleFiles(files, basePath) {
    try {
      const uploadPromises = files.map((file) => {
        const path = `${basePath}/${file.name}`;
        return this.uploadFile(file, path);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  // Delete Multiple Files
  async deleteMultipleFiles(paths) {
    try {
      const deletePromises = paths.map((path) => this.deleteFile(path));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw error;
    }
  }

  // Generate Signed URL
  async generateSignedURL(path, expirationTime = 3600) {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  // Get File Metadata
  async getFileMetadata(path) {
    try {
      const storageRef = ref(storage, path);
      const metadata = await storageRef.getMetadata();
      return metadata;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // Copy File
  async copyFile(sourcePath, destinationPath) {
    try {
      const sourceRef = ref(storage, sourcePath);
      const sourceURL = await getDownloadURL(sourceRef);
      
      const response = await fetch(sourceURL);
      const blob = await response.blob();
      
      return await this.uploadFile(blob, destinationPath);
    } catch (error) {
      console.error('Error copying file:', error);
      throw error;
    }
  }

  // Move File
  async moveFile(sourcePath, destinationPath) {
    try {
      await this.copyFile(sourcePath, destinationPath);
      await this.deleteFile(sourcePath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();
