import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import os
import glob
from scipy import signal
from scipy.fft import fft, fftfreq
from scipy.signal import butter, filtfilt, find_peaks
import warnings
warnings.filterwarnings('ignore')

# Set up beautiful plotting style
plt.style.use('default')
sns.set_palette("husl")
plt.rcParams['figure.figsize'] = (15, 8)
plt.rcParams['font.size'] = 12
plt.rcParams['axes.grid'] = True

print("🎨 PPG+Dalia Dataset Visualization Tool")
print("=" * 60)

class PPGDaliaDataExplorer:
    def __init__(self):
        self.subjects_data = {}
        self.dataset_stats = {}
        
    def find_dataset_automatically(self):
        """Automatically find PPG+Dalia dataset"""
        possible_paths = [
            r"C:/Users/bchal/Downloads/ppg+dalia/data/PPG_FieldStudy/S"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                pickle_files = glob.glob(os.path.join(path, "*.pkl"))
                if pickle_files:
                    print(f"✅ Found dataset at: {path}")
                    print(f"📁 Found {len(pickle_files)} subject files")
                    return path
        
        print("❌ Dataset not found automatically!")
        print("📋 Please ensure your dataset is in one of these locations:")
        for path in possible_paths[:5]:
            print(f"   - {path}")
        return None

    def load_single_subject(self, file_path):
        """Load a single subject's data with multiple encoding attempts"""
        try:
            data = None
            loading_methods = [
                lambda f: pickle.load(f, encoding='latin-1'),
                lambda f: pickle.load(f, encoding='bytes'),
                lambda f: pickle.load(f)
            ]
            
            for method in loading_methods:
                try:
                    with open(file_path, 'rb') as f:
                        data = method(f)
                    break
                except:
                    continue
            
            if data is None:
                return None
            
            # Process byte keys to strings
            if isinstance(data, dict):
                processed_data = {}
                for key, value in data.items():
                    if isinstance(key, bytes):
                        try:
                            key = key.decode('utf-8', errors='ignore')
                        except:
                            key = str(key)
                    processed_data[key] = value
                data = processed_data
            
            return data
            
        except Exception as e:
            print(f"⚠️  Could not load {os.path.basename(file_path)}: {e}")
            return None

    def extract_signals_from_subject(self, subject_data):
        """Extract PPG and HR signals from subject data"""
        signals = {}
        
        # Extract PPG signal
        ppg_signal = None
        if 'signal' in subject_data and isinstance(subject_data['signal'], dict):
            signal_dict = subject_data['signal']
            
            # Look for wrist PPG (BVP = Blood Volume Pulse)
            if 'wrist' in signal_dict and isinstance(signal_dict['wrist'], dict):
                wrist_data = signal_dict['wrist']
                if 'BVP' in wrist_data:
                    ppg_signal = np.array(wrist_data['BVP'])
                
                # Also extract other wrist signals if available
                if 'EDA' in wrist_data:
                    signals['eda'] = np.array(wrist_data['EDA'])
                if 'TEMP' in wrist_data:
                    signals['temperature'] = np.array(wrist_data['TEMP'])
            
            # Look for chest ECG as reference
            if 'chest' in signal_dict and isinstance(signal_dict['chest'], dict):
                chest_data = signal_dict['chest']
                if 'ECG' in chest_data:
                    signals['ecg'] = np.array(chest_data['ECG'])
        
        # Extract HR labels (ground truth)
        hr_labels = None
        if 'label' in subject_data:
            hr_labels = np.array(subject_data['label'])
        
        if ppg_signal is not None:
            signals['ppg'] = ppg_signal
        if hr_labels is not None:
            signals['hr_labels'] = hr_labels
            
        return signals

    def load_all_subjects(self, data_path):
        """Load all subjects from the dataset"""
        if not os.path.exists(data_path):
            print(f"❌ Path not found: {data_path}")
            return False
        
        pickle_files = glob.glob(os.path.join(data_path, "*.pkl"))
        if not pickle_files:
            print(f"❌ No .pkl files found in {data_path}")
            return False
        
        print(f"📊 Loading {len(pickle_files)} subjects...")
        loaded_count = 0
        
        for file_path in pickle_files:
            subject_id = os.path.basename(file_path).replace('.pkl', '')
            subject_data = self.load_single_subject(file_path)
            
            if subject_data:
                signals = self.extract_signals_from_subject(subject_data)
                
                if 'ppg' in signals and 'hr_labels' in signals:
                    self.subjects_data[subject_id] = signals
                    loaded_count += 1
                    print(f"   ✅ {subject_id}: PPG({len(signals['ppg'])}) HR({len(signals['hr_labels'])})")
                else:
                    print(f"   ⚠️  {subject_id}: Missing PPG or HR data")
            else:
                print(f"   ❌ {subject_id}: Could not load")
        
        print(f"\n🎉 Successfully loaded {loaded_count} subjects with complete data!")
        return loaded_count > 0

    def analyze_dataset_structure(self):
        """Analyze and print dataset structure"""
        if not self.subjects_data:
            print("❌ No data loaded!")
            return
        
        print(f"\n📋 DATASET STRUCTURE ANALYSIS")
        print("=" * 60)
        
        total_subjects = len(self.subjects_data)
        total_duration = 0
        all_hr_values = []
        signal_types = set()
        
        # Collect statistics
        for subject_id, signals in self.subjects_data.items():
            duration_min = len(signals['ppg']) / 64 / 60  # 64 Hz sampling rate
            total_duration += duration_min
            
            # Sample HR values (every 64th sample = 1 Hz)
            hr_sampled = signals['hr_labels'][::64]
            all_hr_values.extend(hr_sampled)
            
            # Collect signal types
            signal_types.update(signals.keys())
        
        # Print summary
        print(f"📊 Total Subjects: {total_subjects}")
        print(f"⏱️  Total Duration: {total_duration:.1f} minutes ({total_duration/60:.1f} hours)")
        print(f"📈 Signal Types: {', '.join(signal_types)}")
        print(f"❤️  HR Range: {np.min(all_hr_values):.1f} - {np.max(all_hr_values):.1f} BPM")
        print(f"📊 Mean HR: {np.mean(all_hr_values):.1f} ± {np.std(all_hr_values):.1f} BPM")
        print(f"🔢 Total HR Samples: {len(all_hr_values):,}")
        
        # Store stats for later use
        self.dataset_stats = {
            'total_subjects': total_subjects,
            'total_duration': total_duration,
            'all_hr_values': all_hr_values,
            'signal_types': list(signal_types)
        }

    def create_dataset_overview_dashboard(self):
        """Create comprehensive dataset overview"""
        if not self.subjects_data or not self.dataset_stats:
            print("❌ No data available for visualization")
            return
        
        print("\n🎨 Creating Dataset Overview Dashboard...")
        
        # Prepare data
        subject_stats = []
        for subject_id, signals in self.subjects_data.items():
            ppg = signals['ppg']
            hr = signals['hr_labels']
            
            stats = {
                'subject_id': subject_id,
                'duration_min': len(ppg) / 64 / 60,
                'ppg_samples': len(ppg),
                'hr_samples': len(hr),
                'hr_mean': np.mean(hr),
                'hr_std': np.std(hr),
                'hr_min': np.min(hr),
                'hr_max': np.max(hr),
                'hr_range': np.max(hr) - np.min(hr)
            }
            subject_stats.append(stats)
        
        stats_df = pd.DataFrame(subject_stats)
        all_hr = self.dataset_stats['all_hr_values']
        
        # Create dashboard
        fig, axes = plt.subplots(2, 3, figsize=(20, 12))
        
        # 1. Overall HR Distribution
        axes[0, 0].hist(all_hr, bins=50, alpha=0.7, color='skyblue', edgecolor='black')
        axes[0, 0].axvline(np.mean(all_hr), color='red', linestyle='--', linewidth=2,
                          label=f'Mean: {np.mean(all_hr):.1f} BPM')
        axes[0, 0].set_title('❤️ Heart Rate Distribution (All Subjects)', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Heart Rate (BPM)')
        axes[0, 0].set_ylabel('Frequency')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Subject-wise HR Statistics
        x_pos = range(len(stats_df))
        bars = axes[0, 1].bar(x_pos, stats_df['hr_mean'], yerr=stats_df['hr_std'],
                             capsize=5, alpha=0.7, color='lightcoral')
        axes[0, 1].set_title('📊 Mean HR by Subject (±1 STD)', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Subject')
        axes[0, 1].set_ylabel('Heart Rate (BPM)')
        axes[0, 1].set_xticks(x_pos)
        axes[0, 1].set_xticklabels(stats_df['subject_id'], rotation=45)
        axes[0, 1].grid(True, alpha=0.3)
        
        # 3. Recording Duration
        colors = plt.cm.Set3(np.linspace(0, 1, len(stats_df)))
        bars = axes[0, 2].bar(x_pos, stats_df['duration_min'], color=colors, alpha=0.7)
        axes[0, 2].set_title('⏱️ Recording Duration by Subject', fontsize=14, fontweight='bold')
        axes[0, 2].set_xlabel('Subject')
        axes[0, 2].set_ylabel('Duration (minutes)')
        axes[0, 2].set_xticks(x_pos)
        axes[0, 2].set_xticklabels(stats_df['subject_id'], rotation=45)
        axes[0, 2].grid(True, alpha=0.3)
        
        # 4. HR Range by Subject
        axes[1, 0].bar(x_pos, stats_df['hr_range'], color='lightgreen', alpha=0.7)
        axes[1, 0].set_title('📈 HR Range (Max - Min) by Subject', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Subject')
        axes[1, 0].set_ylabel('HR Range (BPM)')
        axes[1, 0].set_xticks(x_pos)
        axes[1, 0].set_xticklabels(stats_df['subject_id'], rotation=45)
        axes[1, 0].grid(True, alpha=0.3)
        
        # 5. HR Categories Distribution
        hr_categories = []
        for hr in all_hr:
            if hr < 70:
                hr_categories.append('Low (< 70)')
            elif hr < 100:
                hr_categories.append('Normal (70-100)')
            else:
                hr_categories.append('High (≥ 100)')
        
        category_counts = pd.Series(hr_categories).value_counts()
        colors_cat = ['lightcoral', 'lightgreen', 'orange']
        axes[1, 1].pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%',
                      colors=colors_cat, startangle=90)
        axes[1, 1].set_title('📊 HR Categories Distribution', fontsize=14, fontweight='bold')
        
        # 6. Box plot of HR by subject (first 8 subjects for clarity)
        hr_by_subject = []
        subject_names = []
        for _, row in stats_df.head(8).iterrows():
            subject_id = row['subject_id']
            hr_data = self.subjects_data[subject_id]['hr_labels'][::320]  # Sample every 5 seconds
            hr_by_subject.append(hr_data)
            subject_names.append(subject_id)
        
        axes[1, 2].boxplot(hr_by_subject, labels=subject_names)
        axes[1, 2].set_title('📦 HR Distribution by Subject (Box Plot)', fontsize=14, fontweight='bold')
        axes[1, 2].set_xlabel('Subject')
        axes[1, 2].set_ylabel('Heart Rate (BPM)')
        axes[1, 2].tick_params(axis='x', rotation=45)
        axes[1, 2].grid(True, alpha=0.3)
        
        plt.suptitle('📊 PPG+Dalia Dataset Overview Dashboard', fontsize=16, fontweight='bold')
        plt.tight_layout()
        plt.show()
        
        # Print summary
        print(f"\n📋 DASHBOARD SUMMARY:")
        print(f"   📊 Subjects visualized: {len(stats_df)}")
        print(f"   ⏱️  Total time: {self.dataset_stats['total_duration']:.1f} minutes")
        print(f"   ❤️  HR categories: {dict(category_counts)}")
        print(f"   📈 Average recording: {stats_df['duration_min'].mean():.1f} ± {stats_df['duration_min'].std():.1f} min")

    def explore_single_subject(self, subject_id=None, time_window=300):
        """Detailed exploration of a single subject"""
        if not self.subjects_data:
            print("❌ No data loaded!")
            return
        
        # Use first subject if none specified
        if subject_id is None:
            subject_id = list(self.subjects_data.keys())[0]
        
        if subject_id not in self.subjects_data:
            print(f"❌ Subject {subject_id} not found")
            print(f"Available subjects: {list(self.subjects_data.keys())}")
            return
        
        signals = self.subjects_data[subject_id]
        ppg = signals['ppg']
        hr = signals['hr_labels']
        
        print(f"\n🔬 EXPLORING SUBJECT: {subject_id}")
        print("=" * 50)
        print(f"   📊 PPG samples: {len(ppg):,}")
        print(f"   ❤️  HR samples: {len(hr):,}")
        print(f"   ⏱️  Duration: {len(ppg)/64/60:.1f} minutes")
        print(f"   📈 HR range: {np.min(hr):.1f} - {np.max(hr):.1f} BPM")
        
        # Select time window for visualization
        fs = 64  # Sampling frequency
        start_time = 300  # Start at 5 minutes to avoid artifacts
        start_idx = min(start_time * fs, len(ppg) - 1)
        end_idx = min((start_time + time_window) * fs, len(ppg))
        
        ppg_window = ppg[start_idx:end_idx]
        hr_window = hr[start_idx:min(end_idx, len(hr))]
        
        # Time vectors
        t_ppg = np.arange(len(ppg_window)) / fs
        t_hr = np.arange(len(hr_window)) / fs
        
        print(f"   🖼️  Showing {time_window} seconds (from {start_time}s)")
        
        # Create detailed visualization
        fig, axes = plt.subplots(3, 2, figsize=(20, 15))
        
        # 1. Raw PPG Signal
        axes[0, 0].plot(t_ppg, ppg_window, 'b-', linewidth=1, alpha=0.8)
        axes[0, 0].set_title(f'📊 Raw PPG Signal - {subject_id}', fontsize=14, fontweight='bold')
        axes[0, 0].set_ylabel('Amplitude')
        axes[0, 0].grid(True, alpha=0.3)
        axes[0, 0].set_xlim(0, max(t_ppg))
        
        # 2. Filtered PPG Signal
        nyquist = fs / 2
        low = 0.5 / nyquist
        high = 4.0 / nyquist
        b, a = butter(4, [low, high], btype='band')
        filtered_ppg = filtfilt(b, a, ppg_window)
        
        axes[0, 1].plot(t_ppg, filtered_ppg, 'g-', linewidth=1.5)
        axes[0, 1].set_title('🔧 Filtered PPG (0.5-4 Hz)', fontsize=14, fontweight='bold')
        axes[0, 1].set_ylabel('Amplitude')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].set_xlim(0, max(t_ppg))
        
        # 3. Heart Rate Signal
        axes[1, 0].plot(t_hr, hr_window, 'r-', linewidth=2)
        axes[1, 0].set_title('❤️ Ground Truth Heart Rate', fontsize=14, fontweight='bold')
        axes[1, 0].set_ylabel('HR (BPM)')
        axes[1, 0].set_xlabel('Time (seconds)')
        axes[1, 0].grid(True, alpha=0.3)
        axes[1, 0].set_xlim(0, max(t_hr))
        
        # Add HR statistics
        hr_mean = np.mean(hr_window)
        hr_std = np.std(hr_window)
        axes[1, 0].axhline(hr_mean, color='orange', linestyle='--', alpha=0.7,
                          label=f'Mean: {hr_mean:.1f} ± {hr_std:.1f} BPM')
        axes[1, 0].legend()
        
        # 4. Frequency Analysis
        if len(filtered_ppg) > 128:  # Need enough samples for meaningful FFT
            # Use a longer window for better frequency resolution
            fft_window = filtered_ppg[:min(len(filtered_ppg), 64*60)]  # 1 minute max
            fft_ppg = fft(fft_window)
            freqs = fftfreq(len(fft_window), 1/fs)
            hr_freqs = freqs * 60  # Convert to BPM
            
            # Keep positive frequencies in HR range
            hr_mask = (hr_freqs >= 40) & (hr_freqs <= 180)
            hr_freqs_filtered = hr_freqs[hr_mask]
            fft_magnitude = np.abs(fft_ppg[hr_mask])
            
            axes[1, 1].plot(hr_freqs_filtered, fft_magnitude, 'purple', linewidth=2)
            axes[1, 1].set_title('🌊 Frequency Spectrum (1-min window)', fontsize=14, fontweight='bold')
            axes[1, 1].set_xlabel('Heart Rate (BPM)')
            axes[1, 1].set_ylabel('Magnitude')
            axes[1, 1].grid(True, alpha=0.3)
            
            # Find and mark dominant frequency
            if len(fft_magnitude) > 0:
                dominant_idx = np.argmax(fft_magnitude)
                dominant_hr = hr_freqs_filtered[dominant_idx]
                axes[1, 1].axvline(dominant_hr, color='red', linestyle='--',
                                  label=f'Dominant: {dominant_hr:.1f} BPM')
                axes[1, 1].legend()
                
                print(f"   🌊 Dominant frequency: {dominant_hr:.1f} BPM")
                print(f"   🎯 Frequency vs actual: {abs(hr_mean - dominant_hr):.1f} BPM difference")
        
        # 5. PPG Signal Quality Assessment
        # Simple quality metrics
        signal_std = np.std(ppg_window)
        signal_mean = np.mean(np.abs(ppg_window))
        quality_ratio = signal_std / (signal_mean + 1e-8)
        
        # PPG characteristics
        ppg_stats = {
            'Mean': np.mean(ppg_window),
            'Std': signal_std,
            'Min': np.min(ppg_window),
            'Max': np.max(ppg_window),
            'Range': np.max(ppg_window) - np.min(ppg_window),
            'Quality': quality_ratio
        }
        
        stats_names = list(ppg_stats.keys())
        stats_values = list(ppg_stats.values())
        
        bars = axes[2, 0].bar(range(len(stats_names)), stats_values, alpha=0.7, color='lightblue')
        axes[2, 0].set_title('📈 PPG Signal Characteristics', fontsize=14, fontweight='bold')
        axes[2, 0].set_xlabel('Metric')
        axes[2, 0].set_ylabel('Value')
        axes[2, 0].set_xticks(range(len(stats_names)))
        axes[2, 0].set_xticklabels(stats_names, rotation=45)
        axes[2, 0].grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bar, value in zip(bars, stats_values):
            height = bar.get_height()
            axes[2, 0].text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                           f'{value:.2f}', ha='center', va='bottom', fontsize=10)
        
        # 6. HR Categories Analysis
        hr_categories = []
        category_colors = []
        for hr_val in hr_window[::64]:  # Sample every second
            if hr_val < 70:
                hr_categories.append('Low')
                category_colors.append('lightcoral')
            elif hr_val < 100:
                hr_categories.append('Normal') 
                category_colors.append('lightgreen')
            else:
                hr_categories.append('High')
                category_colors.append('orange')
        
        category_counts = pd.Series(hr_categories).value_counts()
        
        if len(category_counts) > 0:
            axes[2, 1].pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%',
                          colors=['lightcoral', 'lightgreen', 'orange'], startangle=90)
            axes[2, 1].set_title(f'📊 HR Categories - {subject_id}', fontsize=14, fontweight='bold')
        
        plt.suptitle(f'🔬 Detailed Analysis: Subject {subject_id}', 
                     fontsize=16, fontweight='bold')
        plt.tight_layout()
        plt.show()
        
        # Additional analysis with other signals if available
        if 'eda' in signals or 'temperature' in signals or 'ecg' in signals:
            self.show_additional_signals(subject_id, signals, start_idx, end_idx)

    def show_additional_signals(self, subject_id, signals, start_idx, end_idx):
        """Show additional signals if available"""
        available_signals = [k for k in ['eda', 'temperature', 'ecg'] if k in signals]
        
        if not available_signals:
            return
        
        print(f"\n📊 Additional signals available for {subject_id}: {available_signals}")
        
        fig, axes = plt.subplots(len(available_signals), 1, figsize=(15, 4*len(available_signals)))
        if len(available_signals) == 1:
            axes = [axes]
        
        fs_dict = {'eda': 4, 'temperature': 4, 'ecg': 700}  # Typical sampling rates
        
        for i, signal_name in enumerate(available_signals):
            signal_data = signals[signal_name]
            fs = fs_dict.get(signal_name, 64)
            
            # Adjust indices for different sampling rates
            start_signal = int(start_idx * fs / 64)
            end_signal = int(end_idx * fs / 64)
            start_signal = min(start_signal, len(signal_data) - 1)
            end_signal = min(end_signal, len(signal_data))
            
            signal_window = signal_data[start_signal:end_signal]
            t_signal = np.arange(len(signal_window)) / fs
            
            if signal_name == 'ecg':
                # Downsample ECG for visualization (700 Hz is too dense)
                step = max(1, len(signal_window) // 5000)  # Max 5000 points
                signal_window = signal_window[::step]
                t_signal = t_signal[::step]
            
            axes[i].plot(t_signal, signal_window, linewidth=1.5)
            axes[i].set_title(f'📊 {signal_name.upper()} Signal - {subject_id}', 
                             fontsize=14, fontweight='bold')
            axes[i].set_ylabel('Amplitude')
            axes[i].grid(True, alpha=0.3)
            
            if i == len(available_signals) - 1:
                axes[i].set_xlabel('Time (seconds)')
        
        plt.suptitle(f'📈 Additional Physiological Signals - {subject_id}', 
                     fontsize=16, fontweight='bold')
        plt.tight_layout()
        plt.show()

    def compare_multiple_subjects(self, subject_list=None, comparison_window=120):
        """Compare multiple subjects side by side"""
        if not self.subjects_data:
            print("❌ No data loaded!")
            return
        
        # Use first 4 subjects if none specified
        if subject_list is None:
            subject_list = list(self.subjects_data.keys())[:4]
        
        # Filter to available subjects
        available_subjects = [s for s in subject_list if s in self.subjects_data]
        
        if not available_subjects:
            print("❌ No valid subjects found for comparison")
            return
        
        print(f"\n🔍 COMPARING SUBJECTS: {available_subjects}")
        print("=" * 60)
        
        fig, axes = plt.subplots(2, 2, figsize=(20, 12))
        axes = axes.flatten()
        
        colors = ['blue', 'green', 'red', 'purple', 'orange', 'brown']
        
        for i, subject_id in enumerate(available_subjects[:4]):
            signals = self.subjects_data[subject_id]
            ppg = signals['ppg']
            hr = signals['hr_labels']
            
            # Select window
            fs = 64
            start_idx = min(300 * fs, len(ppg) - 1)  # Start at 5 minutes
            end_idx = min((300 + comparison_window) * fs, len(ppg))
            
            ppg_window = ppg[start_idx:end_idx]
            hr_window = hr[start_idx:min(end_idx, len(hr))]
            
            t_ppg = np.arange(len(ppg_window)) / fs
            t_hr = np.arange(len(hr_window)) / fs
            
            # Plot PPG
            if i < 2:
                axes[i].plot(t_ppg, ppg_window, color=colors[i], linewidth=1, alpha=0.8)
                axes[i].set_title(f'📊 PPG - {subject_id}', fontsize=14, fontweight='bold')
                axes[i].set_ylabel('PPG Amplitude')
                axes[i].grid(True, alpha=0.3)
            
            # Plot HR
            if i >= 2:
                axes[i].plot(t_hr, hr_window, color=colors[i], linewidth=2)
                axes[i].set_title(f'❤️ HR - {available_subjects[i-2]}', fontsize=14, fontweight='bold')
                axes[i].set_ylabel('Heart Rate (BPM)')
                axes[i].set_xlabel('Time (seconds)')
                axes[i].grid(True, alpha=0.3)
                
                # Add mean line
                hr_mean = np.mean(hr_window)
                axes[i].axhline(hr_mean, color=colors[i], linestyle='--', alpha=0.7,
                               label=f'Mean: {hr_mean:.1f} BPM')
                axes[i].legend()
        
        plt.suptitle(f'🔍 Multi-Subject Comparison ({comparison_window}s windows)', 
                     fontsize=16, fontweight='bold')
        plt.tight_layout()
        plt.show()
        
        # Print comparison statistics
        print(f"\n📊 COMPARISON STATISTICS:")
        for subject_id in available_subjects:
            signals = self.subjects_data[subject_id]
            hr = signals['hr_labels']
            print(f"   {subject_id}: HR {np.mean(hr):.1f}±{np.std(hr):.1f} BPM, "
                  f"Duration: {len(signals['ppg'])/64/60:.1f} min")

    def interactive_subject_explorer(self):
        """Interactive exploration menu"""
        if not self.subjects_data:
            print("❌ No data loaded!")
            return
        
        subjects = list(self.subjects_data.keys())
        
        while True:
            print(f"\n🎮 INTERACTIVE SUBJECT EXPLORER")
            print("=" * 50)
            print(f"Available subjects: {len(subjects)}")
            print("\nOptions:")
            print("1. Explore specific subject")
            print("2. Compare multiple subjects") 
            print("3. Show dataset overview")
            print("4. List all subjects")
            print("5. Exit")
            
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == '1':
                print(f"\nAvailable subjects: {subjects}")
                subject_id = input("Enter subject ID: ").strip()
                if subject_id in subjects:
                    self.explore_single_subject(subject_id)
                else:
                    print(f"❌ Subject {subject_id} not found!")
            
            elif choice == '2':
                print(f"\nAvailable subjects: {subjects}")
                subject_input = input("Enter subject IDs (comma-separated): ").strip()
                if subject_input:
                    subject_list = [s.strip() for s in subject_input.split(',')]
                    self.compare_multiple_subjects(subject_list)
                else:
                    self.compare_multiple_subjects()
            
            elif choice == '3':
                self.create_dataset_overview_dashboard()
            
            elif choice == '4':
                print(f"\n📋 All subjects ({len(subjects)}):")
                for i, subject_id in enumerate(subjects, 1):
                    signals = self.subjects_data[subject_id]
                    duration = len(signals['ppg']) / 64 / 60
                    hr_mean = np.mean(signals['hr_labels'])
                    print(f"   {i:2d}. {subject_id}: {duration:.1f} min, HR {hr_mean:.1f} BPM")
            
            elif choice == '5':
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid choice! Please enter 1-5.")

    def run_complete_exploration(self, data_path=None):
        """Run complete data exploration pipeline"""
        print("🚀 STARTING PPG+DALIA DATA EXPLORATION")
        print("=" * 80)
        
        # 1. Find dataset
        if data_path is None:
            data_path = self.find_dataset_automatically()
        
        if not data_path:
            print("❌ Cannot proceed without dataset!")
            return False
        
        # 2. Load all subjects
        success = self.load_all_subjects(data_path)
        if not success:
            return False
        
        # 3. Analyze structure
        self.analyze_dataset_structure()
        
        # 4. Create overview dashboard
        self.create_dataset_overview_dashboard()
        
        # 5. Explore first subject in detail
        first_subject = list(self.subjects_data.keys())[0]
        self.explore_single_subject(first_subject)
        
        # 6. Compare first few subjects
        self.compare_multiple_subjects()
        
        print(f"\n🎉 EXPLORATION COMPLETE!")
        print("💡 Use interactive_subject_explorer() for more detailed exploration")
        
        return True

# Main execution
def explore_ppg_dalia_dataset(data_path=None):
    """Main function to explore PPG+Dalia dataset"""
    explorer = PPGDaliaDataExplorer()
    
    success = explorer.run_complete_exploration(data_path)
    
    if success:
        print(f"\n🎮 Starting interactive explorer...")
        explorer.interactive_subject_explorer()
    
    return explorer

# Run the exploration
if __name__ == "__main__":
    print("🎨 Welcome to PPG+Dalia Dataset Visualizer!")
    print("=" * 60)
    
    # Option 1: Auto-discover dataset
    explorer = explore_ppg_dalia_dataset()
    
    # Option 2: Specify path manually
    # custom_path = r"c:\Users\bchal\Downloads\ppg+dalia\data\PPG_FieldStudy"
    # explorer = explore_ppg_dalia_dataset(custom_path)