# E-Laboratory Immunoglobulin Analysis System

A comprehensive React Native mobile application for managing patient immunoglobulin test results and medical records.

## Features

### 1. User Management
- User Registration and Authentication
- Profile Management
- Secure Login/Logout
- Personal and Medical Information Storage

### 2. Patient Information Management
- Comprehensive Patient Details
  * Personal Information
  * Medical History
  * Sample Information
  * Clinical History

### 3. Laboratory Analysis
- Immunoglobulin Test Results
  * IgG (700-1600 mg/dL)
  * IgA (70-400 mg/dL)
  * IgM (40-230 mg/dL)
  * IgE (<100)
- Result Comments
- Automatic Timestamps
- Reference Range Validation

### 4. Test Results Visualization
- Color-coded Status Indicators
  * ↑ High (Red)
  * ↓ Low (Red)
  * ↔ Normal (Green)
- Search Functionality
  * Patient-based Search
  * Immunoglobulin-specific Search
- Result Summary Cards
- Chronological History

### 5. Admin Features
- Create and manage reference guides based on patient age groups
- Set custom reference ranges for:
  - IgG (Immunoglobulin G)
  - IgA (Immunoglobulin A)
  - IgM (Immunoglobulin M)
  - IgE (Immunoglobulin E)
- Monitor and validate test results against age-specific ranges

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Scan the QR code with Expo Go app
- Or run on emulator:
```bash
npm run android
# or
npm run ios
```

## Project Structure
```
e-laboratory-system/
├── src/
│   └── screens/
│       ├── Login.js           # User authentication
│       ├── Registration.js    # New user registration
│       ├── PatientForm.js     # Patient information entry
│       ├── TestResults.js     # Results visualization
│       └── AdminDashboard.js  # Admin features
├── App.js                     # Main application setup
├── package.json              # Project dependencies
└── README.md                # Documentation
```

## Dependencies
- React Native with Expo
- React Navigation (Native Stack)
- React Native Paper
- AsyncStorage
- React Native Safe Area Context
- React Native Screens

## Features in Detail

### User Authentication
- Secure local storage of credentials
- Form validation
- Error handling
- Persistent login state

### Patient Management
- Patient information entry
- Sample tracking
- Medical history recording
- Data validation

### Laboratory Analysis
- Comprehensive test result entry
- Automatic validation against reference ranges
- Result categorization (High/Normal/Low)
- Comments and observations

### Results Visualization
- Clear, color-coded indicators
- Easy-to-read summary cards
- Advanced search capabilities
- Chronological result history

### Admin Features
- Create and manage reference guides based on patient age groups
- Set custom reference ranges for each immunoglobulin type
- Monitor and validate test results against age-specific ranges

## Development

### Prerequisites
- Node.js
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup Development Environment
1. Install Expo CLI:
```bash
npm install -g expo-cli
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

## Usage Guide

### 1. User Registration
1. Launch the application
2. Click "Register" on the login screen
3. Fill in required information
4. Submit registration form

### 2. Login
1. Enter username and password
2. Click "Login"
3. Access your dashboard

### 3. Adding Patient Information
1. Navigate to Patient Form
2. Enter patient details
3. Add sample information
4. Save patient record

### 4. Recording Test Results
1. Select patient
2. Enter immunoglobulin values
3. Add any relevant comments
4. Submit test results

### 5. Viewing Results
1. Navigate to Test Results
2. Use search to find specific patients
3. View color-coded results
4. Check result history

### 6. Admin Features
1. Login with admin credentials
2. Access reference guide management
3. Create age-specific reference ranges
4. Monitor test results and ranges

## Security Features
- Local data storage
- Secure credential management
- Input validation
- Error handling

## Best Practices
- Regular data backup
- Accurate patient information
- Proper sample identification
- Regular system updates

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
This project is licensed under the MIT License.
