import Input from "@/components/Input";
import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { useState } from "react";

export default function Profile() {
  const [isInvalid, setIsInvalid] = useState({
    username: false,
    email: false,
    password: false,
  });
  const [inputValue, setInputValue] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [editable, setEditable] = useState(false);

  const handleSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // للتحقق من الإيميل
    const updatedInvalid = {
      username: inputValue.username.length < 3,
      email: !emailRegex.test(inputValue.email),
      password: inputValue.password.length < 6,
    };
    setIsInvalid(updatedInvalid);
  };
  const handleInputChange = (field: string, value: string) => {
    setInputValue((prev) => ({
      ...prev,
      [field]: value,
    }));

    // تحقق مباشر بعد التغيير
    setIsInvalid((prev) => ({
      ...prev,
      username: field === "username" ? value.length < 3 : prev.username,
      email:
        field === "email"
          ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          : prev.email,
      password: field === "password" ? value.length < 6 : prev.password,
    }));
  };

  return (
    <VStack>
      <Image
        className="w-full h-64"
        source={{
          uri: "https://plus.unsplash.com/premium_photo-1732569119693-05321f406646?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        }}
        alt="image"
      />
      <VStack className="items-center -mt-10 gap-y-4">
        <Avatar size="xl">
          <AvatarFallbackText>Jane Doe</AvatarFallbackText>
          <AvatarImage
            className="border-4 border-white"
            source={{
              uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
            }}
          />
          <AvatarBadge />
        </Avatar>

        <VStack className="w-full rounded-md">
          <Input
            isDisabled={!editable}
            validation={isInvalid.username}
            valueName="username"
            name="Kullanıcı Adı"
            placeholder="Kullanıcı adı giriniz"
            helperText=""
            errorText="Kullanıcı adı en az 3 karakter olmalıdır."
            inputValue={inputValue.username}
            setInputValue={handleInputChange}
          />
          <Input
            isDisabled={!editable}
            validation={isInvalid.email}
            valueName="email"
            name="E-posta"
            placeholder="E-posta adresi giriniz"
            helperText="E-posta adresinizi giriniz."
            errorText="Geçerli bir e-posta adresi giriniz."
            inputValue={inputValue.email}
            setInputValue={handleInputChange}
          />
          <Input
            validation={isInvalid.password}
            isDisabled={!editable}
            valueName="password"
            name="Parola"
            type="password"
            placeholder="Parola giriniz"
            helperText="Parolanızı en az 6 karakter olacak şekilde belirleyiniz."
            errorText="Parola en az 6 karakter olmalıdır."
            inputValue={inputValue.password}
            setInputValue={handleInputChange}
          />
          {editable ? (
            <HStack>
              <Button className="flex-1 mt-4 mx-4 h-12" onPress={handleSubmit}>
                <ButtonText className="text-xl">Kaydet</ButtonText>
              </Button>
              <Button
                onPress={() => setEditable(false)}
                className="flex-1 mt-4 mx-4 h-12"
                action="negative"
              >
                <ButtonText className="text-xl">IPTAL</ButtonText>
              </Button>
            </HStack>
          ) : (
            <Button
              className="mt-4 mx-4 h-12"
              onPress={() => setEditable(true)}
            >
              <ButtonText className="text-xl">Düzenle</ButtonText>
            </Button>
          )}
        </VStack>
      </VStack>
    </VStack>
  );
}
