import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Image } from "@/components/ui/image";
import { StyleSheet, Text, View } from "react-native";

export default function Profile() {
  return (
    <View>
      <Image
        className="w-full h-64"
        source={{
          uri: "https://plus.unsplash.com/premium_photo-1732569119693-05321f406646?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        }}
        alt="image"
      />
      <View>
        <Avatar size="xl">
          <AvatarFallbackText>Jane Doe</AvatarFallbackText>
          <AvatarImage
            source={{
              uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
            }}
          />
          <AvatarBadge />
        </Avatar>
        <Text>Jane Doe</Text>
      </View>
    </View>
  );
}
