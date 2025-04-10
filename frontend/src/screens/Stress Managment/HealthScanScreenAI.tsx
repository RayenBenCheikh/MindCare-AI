import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { DetectionResult } from 'expo-face-detector';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';

interface VitalSigns {
  heartRate: number | null;
  systolicBP: number | null;
  riskScore: number | null;
}

export default function HealthScanScreenAI() {
  // Permission states
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  // Camera states
  const cameraRef = useRef<Camera | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  
  // Face detection states
  const [face, setFace] = useState<any>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  
  // Vital sign measurement states
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [systolicBP, setSystolicBP] = useState<number | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  
  // Signal processing data
  const frameHistory = useRef<number[]>([]);
  const timeHistory = useRef<number[]>([]);
  const bpmHistory = useRef<number[]>([]);
  const sysHistory = useRef<number[]>([]);
  
  // Request camera permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'This app needs camera access to detect vital signs',
          [{ text: 'OK' }]
        );
      }
    };
    
    requestPermissions();
    
    return () => {
      // Cleanup
      frameHistory.current = [];
      timeHistory.current = [];
      bpmHistory.current = [];
      sysHistory.current = [];
    };
  }, []);
  
  // Function to handle face detection
  const handleFacesDetected = ({ faces }: DetectionResult) => {
    if (faces.length > 0 && !processing) {
      setFace(faces[0]);
      if (!analyzing) {
        startVitalSignAnalysis();
      }
    } else if (faces.length === 0) {
      setFace(null);
    }
  };
  
  // Start the vital sign analysis process
  const startVitalSignAnalysis = () => {
    setAnalyzing(true);
    // Reset histories
    frameHistory.current = [];
    timeHistory.current = [];
    bpmHistory.current = [];
    sysHistory.current = [];
    
    // Start the analysis loop
    runVitalSignAnalysis();
  };
  
  // Main analysis loop
  const runVitalSignAnalysis = () => {
    // Process at regular intervals
    const analysisInterval = setInterval(() => {
      if (frameHistory.current.length >= 300) {
        // Stop collecting data after 300 frames (about 10 seconds at 30fps)
        clearInterval(analysisInterval);
        calculateVitalSigns();
      } else if (cameraRef.current && face) {
        captureFrame();
      }
    }, 30); // Try to capture at roughly 30fps
    
    return () => clearInterval(analysisInterval);
  };
  
  // Capture frame for processing
  const captureFrame = async () => {
    if (processing) return;
    
    setProcessing(true);
    try {
      // In a real app, you would access raw pixel data here
      // For demo purposes, we'll simulate the signal
      simulateFrameProcessing();
    } catch (error) {
      console.error('Frame capture error:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Simulate the PPG signal processing
  // In a real app, this would analyze actual camera frames
  const simulateFrameProcessing = () => {
    const timestamp = Date.now() / 1000;
    timeHistory.current.push(timestamp);
    
    // Simulate PPG signal with heart rate around 68
    const simulatedValue = Math.sin(timestamp * Math.PI * (68/60)) + 
                          Math.random() * 0.2;
    frameHistory.current.push(simulatedValue);
    
    // Update vital signs periodically as we collect data
    if (frameHistory.current.length % 30 === 0) {
      updateVitalSigns();
    }
  };
  
  // Calculate vital signs from collected data
  const updateVitalSigns = () => {
    // Calculate heart rate
    const bpm = calculateHeartRate();
    if (bpm) {
      bpmHistory.current.push(bpm);
      // Calculate average of last 5 BPM values
      const avgBpm = bpmHistory.current.slice(-5).reduce((a, b) => a + b, 0) / 
                    Math.min(bpmHistory.current.length, 5);
      setHeartRate(Math.round(avgBpm));
      
      // Estimate blood pressure (simplified model)
      const sys = estimateBloodPressure(avgBpm);
      sysHistory.current.push(sys);
      const avgSys = sysHistory.current.slice(-5).reduce((a, b) => a + b, 0) / 
                    Math.min(sysHistory.current.length, 5);
      setSystolicBP(Math.round(avgSys));
      
      // Calculate risk score
      if (sysHistory.current.length > 3) {
        const risk = calculateRiskScore(avgBpm, avgSys);
        setRiskScore(risk);
      }
    }
  };
  
  // Calculate heart rate from the signal
  const calculateHeartRate = (): number | null => {
    if (frameHistory.current.length < 90) return null;
    
    // Get a window of the signal
    const signal = frameHistory.current.slice(-90);
    const times = timeHistory.current.slice(-90);
    
    // Find peaks using a simple threshold
    const peaks = [];
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i-1] && signal[i] > signal[i+1] && signal[i] > 0.2) {
        peaks.push(i);
      }
    }
    
    if (peaks.length < 2) return null;
    
    // Calculate time differences between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(times[peaks[i]] - times[peaks[i-1]]);
    }
    
    // Calculate average interval and convert to BPM
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;
    
    // Apply bounds check
    if (bpm >= 40 && bpm <= 180) {
      return bpm;
    }
    
    return null;
  };
  
  // Estimate blood pressure from heart rate
  const estimateBloodPressure = (bpm: number): number => {
    // Very simplified model (not medically accurate)
    // In reality, this would use a trained model with more variables
    const age = 30; // Assumed age
    const sys = 90 + (0.6 * bpm) + (0.5 * age);
    
    // Add some variation
    return sys + (Math.random() * 6 - 3);
  };
  
  // Calculate risk score (simplified)
  const calculateRiskScore = (bpm: number, sys: number): number => {
    // Simplified risk model
    let risk = 0;
    
    // BPM risk component
    if (bpm < 60) risk += 0.1;
    else if (bpm > 100) risk += 0.3;
    
    // Blood pressure risk component
    if (sys < 90) risk += 0.2;
    else if (sys > 120 && sys <= 129) risk += 0.2;
    else if (sys >= 130 && sys <= 139) risk += 0.4;
    else if (sys >= 140) risk += 0.6;
    
    // Bound the risk between 0 and 1
    return Math.min(Math.max(risk, 0), 1);
  };
  
  // Final calculation of vital signs
  const calculateVitalSigns = () => {
    updateVitalSigns();
    setAnalyzing(false);
  };
  
  // Toggle between front and back camera
  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.front
        ? Camera.Constants.Type.back
        : Camera.Constants.Type.front
    );
  };
  
  // Wait for camera to be ready
  const onCameraReady = () => {
    setIsCameraReady(true);
  };
  
  // Render health indicator based on risk score
  const renderHealthIndicator = () => {
    if (riskScore === null) return null;
    
    let color = '#4CAF50'; // Green - Low risk
    if (riskScore > 0.3) color = '#FF9800'; // Orange - Medium risk
    if (riskScore > 0.6) color = '#F44336'; // Red - High risk
    
    return (
      <View style={[styles.healthIndicator, { backgroundColor: color }]}>
        <Text style={styles.healthText}>
          {riskScore < 0.3 ? 'Healthy' : riskScore < 0.6 ? 'Monitor' : 'Consult Doctor'}
        </Text>
      </View>
    );
  };
  
  // Status message at the bottom
  const getStatusMessage = () => {
    if (!face) return "Position your face in the frame";
    if (analyzing) return "Stay still for better AI Analysis";
    if (heartRate) return "Analysis complete";
    return "Preparing analysis...";
  };
  
  // If we don't have permission yet, show placeholder
  if (hasCameraPermission === null) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }
  
  // If permission was denied
  if (hasCameraPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPermissionText}>
          Camera access is required for vital sign monitoring.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        {/* Camera Component */}
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          onCameraReady={onCameraReady}
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
            minDetectionInterval: 100,
            tracking: true,
          }}
        />
        
        {/* Face Detection Oval */}
        {face && (
          <View style={styles.faceOval} />
        )}
        
        {/* Vital Signs Display */}
        <View style={styles.vitalSignsContainer}>
          {/* Heart Rate */}
          <View style={styles.vitalSign}>
            <View style={styles.heartRateIcon}>
              <FontAwesome name="heart" size={24} color="white" />
            </View>
            <Text style={styles.vitalValue}>
              {heartRate ? `${heartRate}` : '--'}<Text style={styles.vitalUnit}>bpm</Text>
            </Text>
          </View>
          
          {/* Blood Pressure */}
          <View style={styles.vitalSign}>
            <Text style={styles.vitalValue}>
              {systolicBP ? `${systolicBP}` : '--'}<Text style={styles.vitalUnit}>sys</Text>
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Status Message */}
        <View style={styles.statusContainer}>
          {analyzing && <MaterialIcons name="warning" size={16} color="#FFA000" />}
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
        </View>
        
        {/* Bottom Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="options-outline" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton}>
            <FontAwesome name="camera" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  noPermissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    margin: 24,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  faceOval: {
    position: 'absolute',
    width: 280,
    height: 350,
    borderRadius: 140, // Half width (ellipse)
    borderWidth: 2,
    borderColor: 'white',
    top: '50%',
    left: '50%',
    marginLeft: -140,
    marginTop: -175,
  },
  vitalSignsContainer: {
    position: 'absolute',
    top: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  vitalSign: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  heartRateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8BC34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  vitalUnit: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'normal',
  },
  healthIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  healthText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  statusText: {
    color: '#FFA000',
    marginLeft: 4,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});