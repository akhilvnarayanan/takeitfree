import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { authService } from '../services/authService';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [message, setMessage] = useState('');

  const requestOtp = async () => {
    if (mode === 'email') {
      const { error } = await authService.signInWithEmailOtp(email);
      setMessage(error ? error.message : 'Email OTP sent');
    } else {
      const { error } = await authService.signInWithPhoneOtp(phone);
      setMessage(error ? error.message : 'Phone OTP sent');
    }
  };

  const verifyOtp = async () => {
    const result =
      mode === 'email'
        ? await authService.verifyEmailOtp(email, token)
        : await authService.verifyPhoneOtp(phone, token);
    setMessage(result.error ? result.error.message : 'Authenticated');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TakeItFree Auth</Text>
      <Button title={`Switch to ${mode === 'email' ? 'Phone OTP' : 'Email OTP'}`} onPress={() => setMode(mode === 'email' ? 'phone' : 'email')} />
      {mode === 'email' ? (
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      ) : (
        <TextInput placeholder="Phone (+1...)" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      )}
      <Button title="Send OTP" onPress={requestOtp} />
      <TextInput placeholder="OTP Code" style={styles.input} value={token} onChangeText={setToken} keyboardType="number-pad" />
      <Button title="Verify OTP" onPress={verifyOtp} />
      <Text>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, gap: 12 },
  title: { fontWeight: '700', fontSize: 24 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10 },
});
