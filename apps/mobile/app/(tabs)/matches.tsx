import { View, Text, StyleSheet } from "react-native"

export default function MatchesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Matches</Text>
      <Text style={styles.empty}>Aucun match pour le moment.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  empty: { color: "#666" },
})
