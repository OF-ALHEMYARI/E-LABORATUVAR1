import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { MaterialIcons } from '@expo/vector-icons';
import { Icon } from '@/components/ui/icon';
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectItem } from '@/components/ui/select';

const TEST_TYPES = ['IgA', 'IgM', 'IgG', 'IgG1', 'IgG2', 'IgG3', 'IgG4'];
const AGE_GROUPS = ['0-3 ay', '4-6 ay', '7-12 ay', '1-5 yaş', '6-10 yaş', '11-16 yaş', 'Yetişkin'];

const GuidesManagement = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [formData, setFormData] = useState({
    guideName: '',
    testType: '',
    ageGroup: '',
    minValue: '',
    maxValue: '',
  });

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.105:3000/admin/guides');
      const data = await response.json();
      setGuides(data);
    } catch (error) {
      console.error('Error loading guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.guideName || !formData.testType || !formData.ageGroup || !formData.minValue || !formData.maxValue) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.105:3000/admin/guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          guideName: '',
          testType: '',
          ageGroup: '',
          minValue: '',
          maxValue: '',
        });
        loadGuides();
      }
    } catch (error) {
      console.error('Error creating guide:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <Box className="p-6">
        <Text className="text-2xl font-bold mb-6">Kılavuz Yönetimi</Text>

        {/* Yeni Kılavuz Formu */}
        <Box className="bg-white p-4 rounded-xl shadow-md mb-6">
          <Text className="text-xl font-semibold mb-4">Yeni Kılavuz Ekle</Text>
          <VStack space="md">
            <Input>
              <InputField
                placeholder="Kılavuz Adı"
                value={formData.guideName}
                onChangeText={(text) => setFormData({ ...formData, guideName: text })}
              />
            </Input>

            <Select
              selectedValue={formData.testType}
              onValueChange={(value) => setFormData({ ...formData, testType: value })}
            >
              <SelectTrigger>
                <SelectInput placeholder="Test Türü" />
              </SelectTrigger>
              <SelectPortal>
                {TEST_TYPES.map((type) => (
                  <SelectItem key={type} label={type} value={type} />
                ))}
              </SelectPortal>
            </Select>

            <Select
              selectedValue={formData.ageGroup}
              onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
            >
              <SelectTrigger>
                <SelectInput placeholder="Yaş Grubu" />
              </SelectTrigger>
              <SelectPortal>
                {AGE_GROUPS.map((group) => (
                  <SelectItem key={group} label={group} value={group} />
                ))}
              </SelectPortal>
            </Select>

            <HStack space="md">
              <Input flex={1}>
                <InputField
                  placeholder="Min Değer"
                  value={formData.minValue}
                  onChangeText={(text) => setFormData({ ...formData, minValue: text })}
                  keyboardType="numeric"
                />
              </Input>
              <Input flex={1}>
                <InputField
                  placeholder="Max Değer"
                  value={formData.maxValue}
                  onChangeText={(text) => setFormData({ ...formData, maxValue: text })}
                  keyboardType="numeric"
                />
              </Input>
            </HStack>

            <Button onPress={handleSubmit} className="bg-blue-500">
              <Icon as={MaterialIcons} name="add" color="white" size="sm" className="mr-2" />
              <ButtonText>Kılavuz Ekle</ButtonText>
            </Button>
          </VStack>
        </Box>

        {/* Mevcut Kılavuzlar */}
        <Box className="bg-white p-4 rounded-xl shadow-md">
          <Text className="text-xl font-semibold mb-4">Mevcut Kılavuzlar</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#0891b2" />
          ) : (
            <VStack space="md">
              {guides.map((guide) => (
                <Box
                  key={guide.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <VStack>
                    <Text className="font-semibold">{guide.guide_name}</Text>
                    <HStack className="justify-between mt-2">
                      <Text className="text-gray-600">{guide.test_type}</Text>
                      <Text className="text-gray-600">{guide.age_group}</Text>
                    </HStack>
                    <HStack className="justify-between mt-2">
                      <Text className="text-gray-500">
                        Referans Aralığı: {guide.min_value} - {guide.max_value}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Box>
    </ScrollView>
  );
};

export default GuidesManagement;
