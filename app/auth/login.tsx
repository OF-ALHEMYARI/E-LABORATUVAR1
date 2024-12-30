import React, { useState } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Link, router } from 'expo-router';
import { Image } from '@/components/ui/image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// بيانات المستخدمين للاختبار
const USERS = {
  'admin@test.com': { password: 'admin123', role: 'admin', name: 'Admin User' },
  'doctor@test.com': { password: 'doctor123', role: 'doctor', name: 'Doctor User' },
  'user@test.com': { password: 'user123', role: 'patient', name: 'Normal User' }
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const user = USERS[email];
    if (!user || user.password !== password) {
      alert('Geçersiz e-posta veya şifre');
      return;
    }

    // حفظ بيانات المستخدم
    await AsyncStorage.setItem('userRole', user.role);
    await AsyncStorage.setItem('userName', user.name);

    // توجيه المستخدم حسب نوعه
    if (user.role === 'admin') {
      router.replace('/admin/index');
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  return (
    <Box className="flex-1 justify-center p-6 bg-white">
      <VStack space="xl" className="items-center mb-8">
        <Image
          source={{uri: 'https://i.hizliresim.com/6w0yq1f.png'}}
          alt="Logo"
          className="w-32 h-32"
        />
        <Text className="text-2xl font-bold text-center">
          E-Laboratuvar Sistemine Hoş Geldiniz
        </Text>
      </VStack>

      <VStack space="md">
        <Input>
          <Ionicons name="mail" size={20} color="gray" />
          <InputField
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Input>

        <Input>
          <Ionicons name="lock-closed" size={20} color="gray" />
          <InputField
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </Input>

        <Button
          onPress={handleLogin}
          className="bg-blue-500"
          disabled={loading}
        >
          <ButtonText>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</ButtonText>
        </Button>

        <Link href="/auth/register" asChild>
          <Button variant="outline">
            <ButtonText>Hesap Oluştur</ButtonText>
          </Button>
        </Link>

        {/* معلومات للاختبار */}
        <Box className="mt-8 p-4 bg-gray-100 rounded-lg">
          <Text className="text-sm text-gray-600">Test Hesapları:</Text>
          <Text className="text-xs text-gray-500">Admin: admin@test.com / admin123</Text>
          <Text className="text-xs text-gray-500">Doktor: doctor@test.com / doctor123</Text>
          <Text className="text-xs text-gray-500">Hasta: user@test.com / user123</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default LoginScreen;
