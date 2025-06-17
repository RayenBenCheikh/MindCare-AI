import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { CameraView, CameraType, Camera } from 'expo-camera';
import axios from 'axios';
import { api, VITAL_SIGNS_URL } from '@/src/api/config';
import { AuthContext } from '@/src/context/AuthContext';
import { API_ENDPOINTS } from '@/src/constants/const';

const API_URL = `${VITAL_SIGNS_URL}/api/analyze`;

const VitalSignsScreen = () => {
  const { userData, userToken } = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [heartRate, setHeartRate] = useState('--');
  const [systolicBP, setSystolicBP] = useState('--');
  const [diastolicBP, setDiastolicBP] = useState('--');
  const [message, setMessage] = useState('Position your face in the frame');
  const [faceDetected, setFaceDetected] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [userId, setUserId] = useState<string>('anonymous_user');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Get user ID from assessment
  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (userToken) {
        try {
          const response = await api.get(API_ENDPOINTS.assessments.latest);
          console.log('Fetched assessment data:', response.data);

          if (response.data?.assessment) {
            if (response.data.assessment._id) {
              console.log('Setting user ID from assessment.user:', response.data.assessment.user);
              setUserId(response.data.assessment._id);
            } else {
              console.log('No user field found in assessment:', response.data.assessment);
              setUserId(response.data.assessment._id);
            }
          } else {
            console.log('No assessment found in response');
          }
        } catch (error) {
          console.error('Error fetching assessment data:', error);
        }
      }
    };

    fetchAssessmentData();
  }, [userToken]);

  // Test server connection
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await axios.get(`${VITAL_SIGNS_URL}/health`);
        if (response.status === 200) {
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
  }, []);

  const startAnalysis = async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Server Connection Error', 'Cannot connect to the vital signs server.');
      return;
    }

    setMessage('Preparing camera...');
    setIsAnalyzing(true);
    setFaceDetected(false);
    setAnalysisComplete(false);

    // Reset previous measurements
    setHeartRate('--');
    setSystolicBP('--');
    setDiastolicBP('--');

    // Short delay to allow UI update before capture
    setTimeout(() => {
      setMessage('Hold still for capture...');
      captureAndAnalyze();
    }, 1000);
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current) return;

    try {
      setMessage('Capturing image...');

      // Take a single photo with reduced quality
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        skipProcessing: true,
      });

      if (!photo || !photo.base64) {
        console.error('Failed to capture photo or missing base64 data');
        setMessage('Failed to capture image. Please try again.');
        setIsAnalyzing(false);
        return;
      }

      console.log("Base64 image length:", photo.base64.length);
      console.log("Using user ID for analysis:", userId);

      setMessage('Analyzing vital signs...');

      // Send to API
      const response = await axios.post(
        API_URL,
        {
          image: `data:image/jpeg;base64,${photo.base64}`,
          saveData: true,  // Set to true to save the data
          saveImage: true,  // Request to save the image too
          userId: userId  // Assessment ID
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000 // 15 second timeout
        }
      );

      // Process response
      if (response.data) {
        if (response.data.error === 'No face detected') {
          setFaceDetected(false);
          setMessage('No face detected. Please center your face and try again.');
        } else {
          setFaceDetected(true);

          // Update measurements
          if (response.data.heart_rate) {
            setHeartRate(response.data.heart_rate.toString());
          }

          if (response.data.systolic_bp) {
            setSystolicBP(response.data.systolic_bp.toString());
          }

          if (response.data.diastolic_bp) {
            setDiastolicBP(response.data.diastolic_bp.toString());
          }

          setMessage('Analysis complete! Results displayed above.');
          setAnalysisComplete(true);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setMessage('Error analyzing image. Please try again.');
      setConnectionStatus('error');
    } finally {
      setIsAnalyzing(false);
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
          <View style={[styles.connectionStatusBar, { backgroundColor: '#F44336' }]}>
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

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={"front" as CameraType}
          ref={cameraRef}
        />

        {/* Overlay content positioned absolutely */}
        <View style={StyleSheet.absoluteFill}>
          {/* Top measurements display */}
          <View style={styles.measurementContainer}>
            {/* Heart Rate */}
            <View style={styles.vitalCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#AECF77' }]}>
                <Text style={styles.iconText}>♥</Text>
              </View>
              <Text style={styles.vitalValue}>{heartRate}</Text>
              <Text style={styles.vitalUnit}>bpm</Text>
            </View>

            {/* Blood Pressure */}
            <View style={styles.vitalCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#A095DF' }]}>
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
              {isAnalyzing && <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 10 }} />}
              <Text style={styles.statusText}>{message}</Text>
            </View>
          </View>

          {/* Bottom controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                analysisComplete ? styles.resetButton : styles.startButton,
                isAnalyzing ? styles.disabledButton : null,
                connectionStatus === 'error' ? styles.disabledButton : null
              ]}
              onPress={analysisComplete ? () => {
                setAnalysisComplete(false);
                setHeartRate('--');
                setSystolicBP('--');
                setDiastolicBP('--');
                setMessage('Position your face in the frame');
                setFaceDetected(false);
              } : startAnalysis}
              disabled={isAnalyzing || connectionStatus === 'error'}
            >
              <Text style={styles.buttonText}>
                {analysisComplete ? 'Reset' : (isAnalyzing ? 'Analyzing...' : 'Analyze Now')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  resetButton: {
    backgroundColor: '#4CAF50',
  },
  camera: {
    flex: 1,
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