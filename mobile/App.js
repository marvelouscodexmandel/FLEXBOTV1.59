import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const DEFAULT_API = 'https://flexbot-api-aynp.onrender.com';
const COMMANDS = [
  ['!ping', 'Check whether the bot can reply'],
  ['!menu', 'Show available command groups'],
  ['!help', 'Read the help guide'],
  ['!calc 12*(4+3)', 'Calculate a basic expression'],
  ['!motivate', 'Get a motivational message'],
  ['!study', 'Open study tools'],
  ['!bible', 'Bible-related command'],
  ['!privacy', 'View privacy guidance'],
];

export default function App() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API);
  const [health, setHealth] = useState('checking');
  const [detail, setDetail] = useState('Checking the FlexBot server…');
  const [tab, setTab] = useState('home');

  async function checkServer() {
    setHealth('checking');
    setDetail('Checking the FlexBot server…');
    try {
      const response = await fetch(apiUrl.replace(/\/$/, '') + '/api/health');
      if (!response.ok) throw new Error('Server returned HTTP ' + response.status);
      const data = await response.json();
      setHealth('online');
      setDetail(data.message || 'The API health endpoint responded successfully.');
    } catch (error) {
      setHealth('offline');
      setDetail('Could not confirm the server. Check your internet connection and API URL, then retry.');
    }
  }

  useEffect(() => { checkServer(); }, []);

  const Tab = ({ id, label }) => (
    <TouchableOpacity accessibilityRole="button" onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabActive]}>
      <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor="#0b1020" />
      <View style={styles.header}>
        <View style={styles.logo}><Text style={styles.logoText}>F</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>FLEXBOT</Text>
          <Text style={styles.version}>WHATSAPP CONTROL · v1.59</Text>
        </View>
        <View style={[styles.dot, health === 'online' ? styles.dotOn : health === 'offline' ? styles.dotOff : styles.dotWait]} />
      </View>
      <View style={styles.tabs}>
        <Tab id="home" label="Overview" />
        <Tab id="commands" label="Commands" />
        <Tab id="settings" label="Server" />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'home' && <>
          <Text style={styles.kicker}>YOUR CONTROL CENTRE</Text>
          <Text style={styles.title}>Your messages.{ '\n' }Your workflow.</Text>
          <Text style={styles.muted}>A first mobile companion for FlexBot 1.59. Connect the server and explore the current command catalogue.</Text>
          <View style={styles.panel}>
            <Text style={styles.panelLabel}>API SERVER</Text>
            <View style={styles.statusRow}>
              <Text style={styles.panelTitle}>{health === 'online' ? 'Server responding' : health === 'offline' ? 'Connection not confirmed' : 'Checking server…'}</Text>
              {health === 'checking' ? <ActivityIndicator color="#8c83ff" /> : <Text style={[styles.statusPill, health === 'online' ? styles.good : styles.bad]}>{health === 'online' ? 'ONLINE' : 'OFFLINE'}</Text>}
            </View>
            <Text style={styles.mutedSmall}>{detail}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={checkServer}><Text style={styles.primaryText}>Check connection again</Text></TouchableOpacity>
          </View>
          <View style={styles.notice}><Text style={styles.noticeTitle}>WhatsApp is a separate step</Text><Text style={styles.mutedSmall}>A healthy server does not prove WhatsApp messaging works. Meta credentials, webhook verification, and a real message test are still required for the current Cloud API backend.</Text></View>
          <Text style={styles.sectionTitle}>Quick commands</Text>
          {COMMANDS.slice(0, 4).map(([cmd, desc]) => <View key={cmd} style={styles.commandRow}><Text style={styles.command}>{cmd}</Text><Text style={styles.commandDesc}>{desc}</Text></View>)}
        </>}
        {tab === 'commands' && <>
          <Text style={styles.kicker}>COMMAND LIBRARY</Text><Text style={styles.title}>Tools at a glance</Text>
          <Text style={styles.muted}>These are command names listed by the current project. This screen does not send commands to WhatsApp.</Text>
          {COMMANDS.map(([cmd, desc]) => <View key={cmd} style={styles.commandRow}><View style={{flex:1}}><Text style={styles.command}>{cmd}</Text><Text style={styles.commandDesc}>{desc}</Text></View><Text style={styles.chevron}>›</Text></View>)}
        </>}
        {tab === 'settings' && <>
          <Text style={styles.kicker}>CONNECTION SETTINGS</Text><Text style={styles.title}>Server address</Text>
          <Text style={styles.muted}>Use the HTTPS URL of your deployed FlexBot API. Do not enter passwords or access tokens here.</Text>
          <Text style={styles.inputLabel}>API BASE URL</Text>
          <TextInput value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://your-api.example.com" placeholderTextColor="#72809a" style={styles.input} />
          <TouchableOpacity style={styles.primaryButton} onPress={checkServer}><Text style={styles.primaryText}>Save and test URL</Text></TouchableOpacity>
          <View style={styles.notice}><Text style={styles.noticeTitle}>Privacy by design</Text><Text style={styles.mutedSmall}>This starter app does not collect message contents or ask for WhatsApp credentials. Sign-in and owner-approved settings changes must be connected before private account controls are enabled.</Text></View>
        </>}
        <Text style={styles.footer}>FLEXBOT 1.59 · Mobile MVP · Connection status is not a WhatsApp verification.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0b1020'},header:{paddingHorizontal:20,paddingTop:18,paddingBottom:18,flexDirection:'row',alignItems:'center',gap:12},logo:{width:44,height:44,borderRadius:14,backgroundColor:'#7166f5',alignItems:'center',justifyContent:'center'},logoText:{fontSize:25,fontWeight:'900',color:'#fff'},brand:{fontSize:18,fontWeight:'900',letterSpacing:2,color:'#f4f6ff'},version:{fontSize:9,letterSpacing:1.5,color:'#9caac1',marginTop:4},dot:{width:10,height:10,borderRadius:5},dotOn:{backgroundColor:'#25c6a2'},dotOff:{backgroundColor:'#f2b84b'},dotWait:{backgroundColor:'#8c83ff'},tabs:{flexDirection:'row',paddingHorizontal:16,gap:8,paddingBottom:10},tab:{paddingVertical:10,paddingHorizontal:13,borderRadius:12,backgroundColor:'#121a2b'},tabActive:{backgroundColor:'#7166f5'},tabText:{fontSize:12,fontWeight:'700',color:'#9caac1'},tabTextActive:{color:'#fff'},content:{padding:20,paddingTop:16,paddingBottom:36},kicker:{fontSize:10,fontWeight:'800',letterSpacing:2,color:'#8c83ff',marginBottom:10},title:{fontSize:31,lineHeight:37,fontWeight:'900',letterSpacing:-1,color:'#f4f6ff',marginBottom:10},muted:{fontSize:14,lineHeight:22,color:'#9caac1',marginBottom:20},panel:{backgroundColor:'#121a2b',borderColor:'#28344b',borderWidth:1,borderRadius:20,padding:18,marginBottom:14},panelLabel:{fontSize:10,letterSpacing:1.6,fontWeight:'800',color:'#9caac1',marginBottom:10},statusRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:8},panelTitle:{fontSize:17,fontWeight:'800',color:'#f4f6ff',flex:1},statusPill:{fontSize:10,fontWeight:'900',paddingHorizontal:9,paddingVertical:6,borderRadius:20,overflow:'hidden'},good:{color:'#7ee7c6',backgroundColor:'#12352e'},bad:{color:'#ffda83',backgroundColor:'#3b2e15'},mutedSmall:{fontSize:12,lineHeight:19,color:'#9caac1'},primaryButton:{backgroundColor:'#7166f5',borderRadius:12,padding:13,alignItems:'center',marginTop:14},primaryText:{fontSize:12,fontWeight:'800',color:'#fff'},notice:{backgroundColor:'#182238',borderColor:'#28344b',borderWidth:1,borderRadius:16,padding:15,marginBottom:20},noticeTitle:{fontSize:13,fontWeight:'800',color:'#f4f6ff',marginBottom:7},sectionTitle:{fontSize:17,fontWeight:'800',color:'#f4f6ff',marginBottom:10,marginTop:2},commandRow:{backgroundColor:'#121a2b',borderWidth:1,borderColor:'#28344b',borderRadius:13,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},command:{fontSize:13,fontWeight:'800',color:'#b8b2ff'},commandDesc:{fontSize:11,lineHeight:17,color:'#9caac1',marginTop:4,flex:1},chevron:{fontSize:25,color:'#7166f5'},inputLabel:{fontSize:10,fontWeight:'800',letterSpacing:1.4,color:'#9caac1',marginBottom:8},input:{backgroundColor:'#121a2b',borderWidth:1,borderColor:'#28344b',borderRadius:12,padding:14,color:'#f4f6ff',fontSize:13},footer:{fontSize:10,lineHeight:16,color:'#68768d',textAlign:'center',marginTop:12}
});
