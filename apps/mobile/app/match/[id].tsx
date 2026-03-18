import { View, Text, StyleSheet } from "react-native"
import { useLocalSearchParams } from "expo-router"

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match Detail</Text>
      <Text style={styles.id}>ID: {id}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  id: { color: "#666" },
})
