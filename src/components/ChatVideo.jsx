import { useVideoPlayer, VideoView } from "expo-video";

export default function ChatVideo({ uri }) {
  // Hook가 화면을 닫을 때 플레이어를 정리한다.
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
      style={{ width: "90%", height: "60%" }}
    />
  );
}
