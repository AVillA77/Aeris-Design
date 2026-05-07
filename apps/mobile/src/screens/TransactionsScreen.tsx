import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      <Text style={styles.placeholder}>Transactions content - TODO: Implement</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  placeholder: { color: '#666' },
})
