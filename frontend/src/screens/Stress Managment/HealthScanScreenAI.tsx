import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import type { Camera as CameraComponent } from 'expo-camera'; // ✅ If you need it as a type

import axios from 'axios';

// Your backend API URL - replace with your actual server address
const API_URL = 'http://192.168.1.100:5000/api/analyze';
// Replace with your actual auth token
const AUTH_TOKEN = 'your-auth-token';

const VitalSignsScreen = () => {
  // Changed from null to undefined to match expected type
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [heartRate, setHeartRate] = useState('--');
  const [systolicBP, setSystolicBP] = useState('--');
  const [diastolicBP, setDiastolicBP] = useState('--');
  const [message, setMessage] = useState('Position your face in the frame');
  const [faceDetected, setFaceDetected] = useState(false);
  
  const cameraRef = useRef<CameraComponen| null>(null);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    
    return () => {
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, []);

  const startAnalysis = async () => {
    setMessage('Calibrating... Stay still');
    setIsAnalyzing(true);
    
    // Calibration period (3 seconds)
    setTimeout(() => {
      setMessage('Analyzing vital signs... Stay still');
      
      // Start capturing frames every 2 seconds
      analysisInterval.current = setInterval(captureAndAnalyze, 2000);
      
      // Stop after 30 seconds
      setTimeout(() => {
        stopAnalysis();
        setMessage('Analysis complete');
      }, 30000);
    }, 3000);
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    setIsAnalyzing(false);
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current) return;
    
    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: true,
      });
      
      // Send to API
      const response = await axios.post(
        API_URL,
        { 
          image: `data:image/jpeg;base64,${photo.base64}`,
          saveData: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      // Process response
      if (response.data) {
        // Check if face was detected
        if (response.data.error === 'No face detected') {
          setFaceDetected(false);
          setMessage('No face detected. Please center your face');
        } else {
          setFaceDetected(true);
          
          // Update measurements with smoothing
          const newHeartRate = response.data.heart_rate;
          const newSystolic = response.data.systolic_bp;
          const newDiastolic = response.data.diastolic_bp;
          
          setHeartRate(prev => {
            if (prev === '--') return newHeartRate.toString();
            return Math.round((parseInt(prev) * 0.7) + (newHeartRate * 0.3)).toString();
          });
          
          setSystolicBP(prev => {
            if (prev === '--') return newSystolic.toString();
            return Math.round((parseInt(prev) * 0.7) + (newSystolic * 0.3)).toString();
          });
          
          setDiastolicBP(prev => {
            if (prev === '--') return newDiastolic.toString();
            return Math.round((parseInt(prev) * 0.7) + (newDiastolic * 0.3)).toString();
          });
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setMessage('Error connecting to server');
    }
  };

  if (hasPermission === undefined) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={styles.camera}
        type={CameraType.front}
        ref={cameraRef}
      >
        {/* Top measurements display */}
        <View style={styles.measurementContainer}>
          {/* Heart Rate */}
          <View style={styles.vitalCard}>
            <View style={[styles.iconCircle, {backgroundColor: '#AECF77'}]}>
              <Text style={styles.iconText}>♥</Text>
            </View>
            <Text style={styles.vitalValue}>{heartRate}</Text>
            <Text style={styles.vitalUnit}>bpm</Text>
          </View>
          
          {/* Blood Pressure */}
          <View style={styles.vitalCard}>
            <View style={[styles.iconCircle, {backgroundColor: '#A095DF'}]}>
              <Text style={styles.iconText}>⟳</Text>
            </View>
            <Text style={styles.vitalValue}>{systolicBP}</Text>
            <Text style={styles.vitalUnit}>sys</Text>
          </View>
        </View>
        
        {/* Face guide overlay */}
        <View style={styles.faceGuideContainer}>
          <View style={styles.faceGuide}>
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
          </View>
        </View>
        
        {/* Status message */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBox}>
            {isAnalyzing && <ActivityIndicator size="small" color="#FFF" style={{marginRight: 10}} />}
            <Text style={styles.statusText}>{message}</Text>
          </View>
        </View>
        
        {/* Bottom controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, isAnalyzing ? styles.stopButton : styles.startButton]}
            onPress={isAnalyzing ? stopAnalysis : startAnalysis}
          >
            <Text style={styles.buttonText}>
              {isAnalyzing ? 'Stop' : 'Start Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
      
      <View style={styles.disclaimerBar}>
        <Text style={styles.disclaimerText}>
          For estimation purposes only. Not for medical use.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  measurementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  vitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vitalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  vitalUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  faceGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 330,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crosshairH: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  crosshairV: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    position: 'absolute',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4285F4',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimerBar: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    alignItems: 'center',
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  }
});

export default VitalSignsScreen;