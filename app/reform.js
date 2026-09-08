import axios from "axios";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

export default function ReformScreen() {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [history, setHistory] = useState([]);
  const [category, setCategory] = useState("");  

  useEffect(() => {
    loadDefault();
  }, []);

   
   
   
  const loadDefault = async () => {
    setLoading(true);
    const rand = Math.random();

    const res = await axios.get(`${BASE_URL}/v1/reform/`, {
      params: { r: rand },
    });

    setCategory(res.data.category || "");
    setVideos(res.data.results || []);
    setNextPageToken(res.data.nextPageToken || null);
    setLoading(false);
  };

   const search = async () => {
    const q = query.trim();
    if (!q) return;

    saveSearchHistory(q);

    setLoading(true);
    const rand = Math.random();

    const res = await axios.get(`${BASE_URL}/v1/reform/search`, {
      params: { query: q, r: rand },
    });

    setVideos(res.data.results || []);
    setNextPageToken(res.data.nextPageToken || null);
    setLoading(false);
  };

   const saveSearchHistory = (term) => {
    setHistory((prev) => {
      const filtered = prev.filter((v) => v !== term);
      return [term, ...filtered].slice(0, 5);
    });
  };

   const onRefresh = async () => {
    setRefreshing(true);

    if (query.trim()) {
      await search();
    } else {
      await loadDefault();
    }

    setRefreshing(false);
  };

   
   
   
  const loadMore = async () => {
    if (!nextPageToken) return;

    setLoadingMore(true);

    const endpoint = query.trim() ? "search" : "";
    const rand = Math.random();

    const res = await axios.get(`${BASE_URL}/v1/reform/${endpoint}`, {
      params: { query, pageToken: nextPageToken, r: rand },
    });

    setVideos((prev) => [...prev, ...res.data.results]);
    setNextPageToken(res.data.nextPageToken);
    setLoadingMore(false);
  };

  const openLink = (url) => Linking.openURL(url);

   
   
   
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonLine} />
    </View>
  );

   
   
   
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        style={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>리폼/업사이클링</Text>
        <Text style={styles.sub}>검색하실 때 예시에 맞게 입력해주세요!</Text>

        {/*   추천 카테고리 */}
        {category !== "" && (
          <Text style={styles.categoryText}>오늘 추천 카테고리: {category}</Text>
        )}

        {/* 🔍 검색 */}
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="EX)셔츠로 치마를 만들고 싶다면 셔츠 치마"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            style={styles.input}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={search}>
            <Text style={{ color: "#fff" }}>검색</Text>
          </TouchableOpacity>
        </View>

        {/*   최근 검색어 */}
        {history.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.historyTitle}>최근 검색어</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {history.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.historyChip}
                  onPress={() => {
                    setQuery(item);
                    setTimeout(search, 50);
                  }}
                >
                  <Text style={styles.historyText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/*   로딩 스켈레톤 */}
        {loading &&
          [...Array(5)].map((_, i) => <SkeletonCard key={i} />)}

        {/*   영상 목록 */}
        {!loading &&
          videos.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => openLink(item.url)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <Text style={styles.title}>{item.title}</Text>
            </TouchableOpacity>
          ))}

        {/*   더보기 */}
        {nextPageToken && !loading && (
          <TouchableOpacity style={styles.moreBtn} onPress={loadMore}>
            {loadingMore ? (
              <ActivityIndicator color="#23422D" />
            ) : (
              <Text style={styles.moreText}>+ 더보기</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 26, fontWeight: "800", color: "#23422D" },
  sub: { fontSize: 13, color: "#777", marginBottom: 10 },

  categoryText: {
    fontSize: 14,
    color: "#23422D",
    marginBottom: 10,
    fontWeight: "700",
  },

  searchWrap: { flexDirection: "row", marginBottom: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },
  searchBtn: {
    paddingHorizontal: 16,
    marginLeft: 10,
    backgroundColor: "#23422D",
    borderRadius: 10,
    justifyContent: "center",
  },

  card: {
    marginBottom: 20,
    backgroundColor: "#fafafa",
    padding: 10,
    borderRadius: 12,
  },
  thumb: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#23422D",
  },

  moreBtn: {
    marginVertical: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#23422D",
    borderRadius: 10,
    alignItems: "center",
  },
  moreText: {
    color: "#23422D",
    fontSize: 14,
    fontWeight: "700",
  },

  skeletonCard: {
    marginBottom: 20,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 12,
  },
  skeletonThumb: {
    width: "100%",
    height: 180,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonLine: {
    width: "70%",
    height: 14,
    backgroundColor: "#ddd",
    borderRadius: 6,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#444",
  },
  historyChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#EFEFEF",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 12,
    color: "#333",
  },
});
