  
import { Image as ExpoImage } from "expo-image";
import { useState } from "react";
import { Image as RNImage } from "react-native";

export default function ImageRatio({
  source,
  style = {},
  isExpo = true,
  fit = "cover",
}) {
  const [ratio, setRatio] = useState(1);

  const onLoadExpo = ({ source }) => {
    if (source?.width && source?.height) {
      setRatio(source.width / source.height);
    }
  };

  const onLoadRN = (e) => {
    const { width, height } = e.nativeEvent.source;
    if (width && height) {
      setRatio(width / height);
    }
  };

  const mergedStyle = [
    style,
    {
      width: "100%",
      aspectRatio: ratio,
    },
  ];

  if (isExpo) {
    return (
      <ExpoImage
        source={source}
        style={mergedStyle}
        contentFit={fit}
        onLoad={onLoadExpo}
      />
    );
  }

  return (
    <RNImage
      source={source}
      style={mergedStyle}
      resizeMode={fit}
      onLoad={onLoadRN}
    />
  );
}
