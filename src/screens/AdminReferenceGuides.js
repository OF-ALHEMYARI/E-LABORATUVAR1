import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, DataTable, Portal, Modal, IconButton, Divider, Chip } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REFERENCE_RANGES, IMMUNOGLOBULIN_UNITS, formatValue } from '../constants/referenceRanges';

const AdminReferenceGuides = ({ navigation }) => {
  const [referenceGuides, setReferenceGuides] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentGuide, setCurrentGuide] = useState({
    ageGroup: '',
    description: '',
    IgG: { min: '', max: '' },
    IgA: { min: '', max: '' },
    IgM: { min: '', max: '' },
    IgE: { max: '' },
    source: '',
    citation: '',
    notes: ''
  });

  useEffect(() => {
    loadReferenceGuides();
  }, []);

  const loadReferenceGuides = async () => {
    try {
      const guides = await AsyncStorage.getItem('referenceGuides');
      if (!guides) {
        // Initialize with default ranges if none exist
        await AsyncStorage.setItem('referenceGuides', JSON.stringify(DEFAULT_REFERENCE_RANGES));
        setReferenceGuides(DEFAULT_REFERENCE_RANGES);
      } else {
        setReferenceGuides(JSON.parse(guides));
      }
    } catch (error) {
      console.error('Error loading reference guides:', error);
    }
  };

  const saveReferenceGuide = async () => {
    try {
      const updatedGuides = [...referenceGuides];
      const existingIndex = updatedGuides.findIndex(
        guide => guide.ageGroup === currentGuide.ageGroup
      );

      if (existingIndex >= 0) {
        updatedGuides[existingIndex] = currentGuide;
      } else {
        updatedGuides.push(currentGuide);
      }

      await AsyncStorage.setItem('referenceGuides', JSON.stringify(updatedGuides));
      setReferenceGuides(updatedGuides);
      setVisible(false);
      resetCurrentGuide();
    } catch (error) {
      console.error('Error saving reference guide:', error);
    }
  };

  const deleteGuide = async (ageGroup) => {
    try {
      const updatedGuides = referenceGuides.filter(
        guide => guide.ageGroup !== ageGroup
      );
      await AsyncStorage.setItem('referenceGuides', JSON.stringify(updatedGuides));
      setReferenceGuides(updatedGuides);
    } catch (error) {
      console.error('Error deleting reference guide:', error);
    }
  };

  const resetCurrentGuide = () => {
    setCurrentGuide({
      ageGroup: '',
      description: '',
      IgG: { min: '', max: '' },
      IgA: { min: '', max: '' },
      IgM: { min: '', max: '' },
      IgE: { max: '' },
      source: '',
      citation: '',
      notes: ''
    });
  };

  const editGuide = (guide) => {
    setCurrentGuide(guide);
    setVisible(true);
  };

  const resetToDefaults = async () => {
    try {
      await AsyncStorage.setItem('referenceGuides', JSON.stringify(DEFAULT_REFERENCE_RANGES));
      setReferenceGuides(DEFAULT_REFERENCE_RANGES);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => {
            resetCurrentGuide();
            setVisible(true);
          }}
          style={styles.button}
        >
          Add New Guide
        </Button>
        <Button
          mode="contained"
          onPress={resetToDefaults}
          style={styles.button}
        >
          Reset to Defaults
        </Button>
      </View>

      <ScrollView>
        {referenceGuides.map((guide, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <Text style={styles.ageGroup}>{guide.ageGroup}</Text>
                  <Text style={styles.description}>{guide.description}</Text>
                </View>
                <View style={styles.headerRight}>
                  <IconButton icon="pencil" size={20} onPress={() => editGuide(guide)} />
                  <IconButton icon="delete" size={20} onPress={() => deleteGuide(guide.ageGroup)} />
                </View>
              </View>

              <Divider style={styles.divider} />

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Test</DataTable.Title>
                  <DataTable.Title numeric>Min</DataTable.Title>
                  <DataTable.Title numeric>Max</DataTable.Title>
                  <DataTable.Title numeric>Unit</DataTable.Title>
                </DataTable.Header>

                <DataTable.Row>
                  <DataTable.Cell>IgG</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgG.min, IMMUNOGLOBULIN_UNITS.IgG)}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgG.max, IMMUNOGLOBULIN_UNITS.IgG)}</DataTable.Cell>
                  <DataTable.Cell numeric>{IMMUNOGLOBULIN_UNITS.IgG}</DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>IgA</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgA.min, IMMUNOGLOBULIN_UNITS.IgA)}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgA.max, IMMUNOGLOBULIN_UNITS.IgA)}</DataTable.Cell>
                  <DataTable.Cell numeric>{IMMUNOGLOBULIN_UNITS.IgA}</DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>IgM</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgM.min, IMMUNOGLOBULIN_UNITS.IgM)}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgM.max, IMMUNOGLOBULIN_UNITS.IgM)}</DataTable.Cell>
                  <DataTable.Cell numeric>{IMMUNOGLOBULIN_UNITS.IgM}</DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>IgE</DataTable.Cell>
                  <DataTable.Cell numeric>-</DataTable.Cell>
                  <DataTable.Cell numeric>{formatValue(guide.IgE.max, IMMUNOGLOBULIN_UNITS.IgE)}</DataTable.Cell>
                  <DataTable.Cell numeric>{IMMUNOGLOBULIN_UNITS.IgE}</DataTable.Cell>
                </DataTable.Row>
              </DataTable>

              <View style={styles.metadataContainer}>
                <Chip icon="book" style={styles.chip}>{guide.source}</Chip>
                <Chip icon="citation" style={styles.chip}>{guide.citation}</Chip>
              </View>
              
              {guide.notes && (
                <Text style={styles.notes}>Note: {guide.notes}</Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>
              {currentGuide.ageGroup ? 'Edit' : 'Add'} Reference Guide
            </Text>

            <TextInput
              label="Age Group"
              value={currentGuide.ageGroup}
              onChangeText={(text) =>
                setCurrentGuide({ ...currentGuide, ageGroup: text })
              }
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={currentGuide.description}
              onChangeText={(text) =>
                setCurrentGuide({ ...currentGuide, description: text })
              }
              style={styles.input}
            />

            <Text style={styles.sectionTitle}>IgG Range</Text>
            <View style={styles.rangeInputs}>
              <TextInput
                label="Min"
                value={currentGuide.IgG.min.toString()}
                onChangeText={(text) =>
                  setCurrentGuide({
                    ...currentGuide,
                    IgG: { ...currentGuide.IgG, min: text }
                  })
                }
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <TextInput
                label="Max"
                value={currentGuide.IgG.max.toString()}
                onChangeText={(text) =>
                  setCurrentGuide({
                    ...currentGuide,
                    IgG: { ...currentGuide.IgG, max: text }
                  })
                }
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>

            <Text style={styles.sectionTitle}>IgA Range</Text>
            <View style={styles.rangeInputs}>
              <TextInput
                label="Min"
                value={currentGuide.IgA.min.toString()}
                onChangeText={(text) =>
                  setCurrentGuide({
                    ...currentGuide,
                    IgA: { ...currentGuide.IgA, min: text }
                  })
                }
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <TextInput
                label="Max"
                value={currentGuide.IgA.max.toString()}
                onChangeText={(text) =>
                  setCurrentGuide({
                    ...currentGuide,
                    IgA: { ...currentGuide.IgA, max: text }
                  })
                }
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>

            <Text style={styles.sectionTitle}>IgM Range</Text>
            <View style={styles.rangeInputs}>
              <TextInput
                label="Min"
                value={currentGuide.IgM.min.toString()}
                onChangeText={(text) =>
                  setCurrentGuide({
                    ...currentGuide,
                    IgM: { ...currentGuide.IgM, min: text }
                  })
                }
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <TextInput
                label="Max"
                value={currentGuide.IgM.max.toString()}
                onChangeText={(text) =>
                  setCurrentGuide({
                    ...currentGuide,
                    IgM: { ...currentGuide.IgM, max: text }
                  })
                }
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>

            <Text style={styles.sectionTitle}>IgE Maximum</Text>
            <TextInput
              label="Max"
              value={currentGuide.IgE.max.toString()}
              onChangeText={(text) =>
                setCurrentGuide({
                  ...currentGuide,
                  IgE: { ...currentGuide.IgE, max: text }
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Source"
              value={currentGuide.source}
              onChangeText={(text) =>
                setCurrentGuide({ ...currentGuide, source: text })
              }
              style={styles.input}
            />

            <TextInput
              label="Citation"
              value={currentGuide.citation}
              onChangeText={(text) =>
                setCurrentGuide({ ...currentGuide, citation: text })
              }
              style={styles.input}
            />

            <TextInput
              label="Clinical Notes"
              value={currentGuide.notes}
              onChangeText={(text) =>
                setCurrentGuide({ ...currentGuide, notes: text })
              }
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={saveReferenceGuide}
                style={styles.modalButton}
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={() => setVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 0.48,
  },
  card: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  ageGroup: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 10,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    marginRight: 8,
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  rangeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeInput: {
    flex: 0.48,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  modalButton: {
    width: '40%',
  },
});

export default AdminReferenceGuides;
