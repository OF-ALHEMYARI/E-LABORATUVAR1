import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Link, router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Icon } from '@/components/ui/icon';
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectItem } from '@/components/ui/select';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    role: 'patient',
    birthDate: '',
    gender: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate form
    if (!formData.email || !formData.password || !formData.name || !formData.surname) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.105:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Kayıt başarılı! Giriş yapabilirsiniz.');
        router.replace('/auth/login');
      } else {
        alert(data.message || 'Kayıt başarısız');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <Box className="flex-1 p-6 bg-white">
        <Text className="text-2xl font-bold text-center mb-8">
          Yeni Hesap Oluştur
        </Text>

        <VStack space="md">
          <Input>
            <Ionicons name="mail" size={24} color="gray" />
            <InputField
              placeholder="E-posta"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Input>

          <Input>
            <Ionicons name="person" size={24} color="gray" />
            <InputField
              placeholder="Ad"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </Input>

          <Input>
            <Ionicons name="person" size={24} color="gray" />
            <InputField
              placeholder="Soyad"
              value={formData.surname}
              onChangeText={(text) => setFormData({ ...formData, surname: text })}
            />
          </Input>

          <Input>
            <Ionicons name="lock-closed" size={24} color="gray" />
            <InputField
              placeholder="Şifre"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />
          </Input>

          <Input>
            <Ionicons name="lock-closed" size={24} color="gray" />
            <InputField
              placeholder="Şifre Tekrar"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
            />
          </Input>

          <Input>
            <Ionicons name="calendar" size={24} color="gray" />
            <InputField
              placeholder="Doğum Tarihi (YYYY-MM-DD)"
              value={formData.birthDate}
              onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
            />
          </Input>

          <Select
            selectedValue={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger>
              <SelectInput placeholder="Cinsiyet" />
            </SelectTrigger>
            <SelectPortal>
              <SelectItem label="Erkek" value="M" />
              <SelectItem label="Kadın" value="F" />
            </SelectPortal>
          </Select>

          <Select
            selectedValue={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectInput placeholder="Hesap Türü" />
            </SelectTrigger>
            <SelectPortal>
              <SelectItem label="Hasta" value="patient" />
              <SelectItem label="Doktor" value="doctor" />
            </SelectPortal>
          </Select>

          <Button
            onPress={handleRegister}
            className="bg-blue-500"
            disabled={loading}
          >
            <ButtonText>
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </ButtonText>
          </Button>

          <Link href="/auth/login" asChild>
            <Button variant="outline">
              <ButtonText>Zaten hesabım var</ButtonText>
            </Button>
          </Link>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default RegisterScreen;
