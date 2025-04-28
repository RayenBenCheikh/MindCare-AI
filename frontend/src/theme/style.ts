import { StyleSheet } from 'react-native';
import { colors } from '../theme';

export const commonWelcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  stepButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  stepButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.marron,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  stepText: {
    color: colors.marron,
    fontSize: 18,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '38%',
    width: '100%',
  },
  illustration: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    paddingTop: 40,
    alignItems: "center",
    width: "100%",
  },
  progressBarContainer: {
    flexDirection: "row",
    width: "60%",
    height: 6,
    borderRadius: 3,
    marginBottom: 30,
    overflow: "hidden",
  },
  progressBarFilled: {
    backgroundColor: colors.marron,
  },
  progressBarEmpty: {
    backgroundColor: "#E8DDD9",
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 30,
    alignItems: 'center',
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.marron,
    alignItems: 'center',
    justifyContent: 'center',
  },
});