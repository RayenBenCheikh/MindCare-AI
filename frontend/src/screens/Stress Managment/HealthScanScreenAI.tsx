import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, Camera, CameraCapturedPicture } from 'expo-camera';
import axios from 'axios';

// Backend API configuration - replace with your actual server address
const API_URL ='http://10.6.68.72:5000/api/analyze';

// For testing purposes - this would typically come from your login process
const DEMO_USER_ID = "67f53c51ae44af41697c7c2c";

const VitalSignsScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [heartRate, setHeartRate] = useState('--');
  const [systolicBP, setSystolicBP] = useState('--');
  const [diastolicBP, setDiastolicBP] = useState('--');
  const [message, setMessage] = useState('Position your face in the frame');
  const [faceDetected, setFaceDetected] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);


  // Test server connection on component mount
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await axios.get('http://10.6.68.72:5000/health');

        if (response.data.status === 'ok') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Server connection error:', error);
        setConnectionStatus('error');
        Alert.alert(
          'Connection Error',
          'Cannot connect to the vital signs server. Please check your network connection and try again.'
        );
      }
    };
    
    checkServerConnection();
  }, []);

  // Request camera permission
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
    if (connectionStatus !== 'connected') {
      Alert.alert('Server Connection Error', 'Cannot connect to the vital signs server. Please check your network connection and try again.');
      return;
    }
    
    setMessage('Calibrating... Stay still');
    setIsAnalyzing(true);
    setFaceDetected(false);
    
    // Reset previous measurements
    setHeartRate('--');
    setSystolicBP('--');
    setDiastolicBP('--');
    
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
      
      // Check if photo was captured successfully
      if (!photo || !photo.base64) {
        console.error('Failed to capture photo or missing base64 data');
        return;
      }
      
      console.log("Base64 image length:", photo.base64.length);
      console.log("Base64 image starts with:", photo.base64.substring(0, 30));
      
      // Send to API
      const response = await axios.post(
        API_URL,
        {
          image: `data:image/jpeg;base64,${photo.base64}`,
          saveData: false,
          userId: DEMO_USER_ID
        },
        {
          headers: {
            'Content-Type': 'application/json',
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
          setMessage('Face detected - analyzing vital signs');
          
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
      setConnectionStatus('error');
    }
  };

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <View style={styles.connectionStatusBar}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.connectionStatusText}>Connecting to server...</Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.connectionStatusBar, {backgroundColor: '#F44336'}]}>
            <Text style={styles.connectionStatusText}>Server connection error</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (hasPermission === undefined) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.permissionButtonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderConnectionStatus()}
      
      <CameraView
        style={styles.camera}
        facing={"front" as CameraType}
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
            <Text style={styles.vitalValue}>{systolicBP}/{diastolicBP}</Text>
            <Text style={styles.vitalUnit}>mmHg</Text>
          </View>
        </View>
        
        {/* Face guide overlay */}
        <View style={styles.faceGuideContainer}>
          <View style={[styles.faceGuide, faceDetected ? styles.faceGuideDetected : null]}>
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
            style={[
              styles.actionButton, 
              isAnalyzing ? styles.stopButton : styles.startButton,
              connectionStatus === 'error' ? styles.disabledButton : null
            ]}
            onPress={isAnalyzing ? stopAnalysis : startAnalysis}
            disabled={connectionStatus === 'error'}
          >
            <Text style={styles.buttonText}>
              {isAnalyzing ? 'Stop' : 'Start Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      
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
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faceGuideDetected: {
    borderColor: '#4CAF50',
    borderWidth: 3,
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
  disabledButton: {
    backgroundColor: '#CCCCCC',
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
  },
  connectionStatusBar: {
    backgroundColor: '#FF9800',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatusText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default VitalSignsScreen;