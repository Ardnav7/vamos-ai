import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../lib/constants";

interface Props {
  size?: number;
  speaking?: boolean;
}

export default function CarlosAvatar({ size = 80, speaking }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        speaking && styles.speaking,
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.35 }]}>C</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  speaking: {
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  letter: {
    color: Colors.white,
    fontWeight: "700",
  },
});
