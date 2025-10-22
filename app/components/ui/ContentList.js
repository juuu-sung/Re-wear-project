// components/ui/ContentList.js

import { useRouter } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ✅ SVG 아이콘 import
import StarOutlineIcon from '../../../assets/icons/star-outline.svg';
import StarIcon from '../../../assets/icons/star.svg';

export default function ContentList({ items, favorites, onToggleFavorite }) {
  const router = useRouter();

  const renderItem = ({ item }) => {
    const isFavorited = favorites.includes(item.id);

    return (
      <View style={styles.itemContainer}>
        {/* 썸네일 이미지 */}
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
        
        <View style={styles.textContainer}>
          <TouchableOpacity onPress={() => router.push(`/article/${item.id}`)}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemAuthor}>{item.author || 'Re:wear'}</Text>
          </TouchableOpacity>
        </View>

        {/* 즐겨찾기 버튼 */}
        <TouchableOpacity onPress={() => onToggleFavorite(item.id)} style={styles.starButton}>
          {isFavorited ? (
            <StarIcon width={28} height={28} fill="#FFD700" />
          ) : (
            <StarOutlineIcon width={28} height={28} fill="#ccc" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: 10 }}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemAuthor: {
    fontSize: 14,
    color: 'gray',
  },
  starButton: {
    padding: 5,
  },
});