import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";

export default function useGalleryLoad() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) return;

      const photos = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 300,
        sortBy: [["creationTime", false]],
      });

      setAssets(photos.assets);
      setLoading(false);
    };

    load();
  }, []);

  return { loading, assets };
}
