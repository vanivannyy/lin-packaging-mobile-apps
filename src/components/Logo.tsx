import { Image, ImageStyle, StyleProp } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoSource = require("../../assets/images/lin-logo.png");

export function Logo({
  size = 72,
  rounded = true,
  style,
}: {
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={logoSource}
      style={[{ width: size, height: size, borderRadius: rounded ? size / 2 : 0 }, style]}
      resizeMode="contain"
    />
  );
}
