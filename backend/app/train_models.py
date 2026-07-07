import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split

# Setup directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(CURRENT_DIR, "models_saved")
os.makedirs(MODEL_DIR, exist_ok=True)

ISOLATION_FOREST_PATH = os.path.join(MODEL_DIR, "isolation_forest.pkl")
RANDOM_FOREST_PATH = os.path.join(MODEL_DIR, "random_forest.pkl")

def train_isolation_forest():
    print("Generating synthetic scan data for Isolation Forest...")
    np.random.seed(42)
    
    # Normal data: low scan counts, reasonable intervals, normal distances, not expired
    # Features: [scan_count, hours_since_last_scan, distance_km, is_expired_val, location_count]
    n_normal = 1000
    normal_scan_count = np.random.randint(1, 4, size=n_normal)
    normal_hours = np.random.uniform(2, 72, size=n_normal)
    normal_dist = np.random.uniform(0, 300, size=n_normal)
    normal_expired = np.zeros(n_normal)
    normal_locations = np.random.randint(1, 3, size=n_normal)
    
    normal_data = np.column_stack((
        normal_scan_count,
        normal_hours,
        normal_dist,
        normal_expired,
        normal_locations
    ))
    
    # Anomalous data: high scan counts, impossible transit, expired, many cities
    n_anomalous = 150
    anom_scan_count = np.random.randint(6, 25, size=n_anomalous)
    anom_hours = np.random.uniform(0.01, 0.5, size=n_anomalous)  # scanned very quickly
    anom_dist = np.random.uniform(500, 2000, size=n_anomalous)   # long distance
    anom_expired = np.random.choice([0, 1], size=n_anomalous, p=[0.3, 0.7])
    anom_locations = np.random.randint(3, 7, size=n_anomalous)
    
    anom_data = np.column_stack((
        anom_scan_count,
        anom_hours,
        anom_dist,
        anom_expired,
        anom_locations
    ))
    
    # Combine (Isolation Forest is trained mostly on normal/unsupervised data, with some anomalies)
    X = np.vstack((normal_data, anom_data))
    
    print("Fitting Isolation Forest model...")
    # contamination represents the approximate proportion of outliers
    clf = IsolationForest(n_estimators=100, contamination=0.12, random_state=42)
    clf.fit(X)
    
    # Save model
    with open(ISOLATION_FOREST_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"Isolation Forest model saved to {ISOLATION_FOREST_PATH}")

def train_random_forest():
    print("Generating synthetic transaction data for Random Forest Classifer...")
    np.random.seed(42)
    
    # Features: [supplier_rating (0-100), price_discrepancy_percent (%), temp_anomaly (0/1), failed_scans]
    # Class: 0 = Low Risk (Authentic), 1 = High Risk (Suspected Counterfeit)
    n_samples = 1200
    
    supplier_rating = np.random.uniform(50, 100, size=n_samples)
    price_discrepancy = np.random.uniform(0, 40, size=n_samples)
    temp_anomaly = np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15])
    failed_scans = np.random.randint(0, 6, size=n_samples)
    
    # Formulate ground truth classes based on logic
    y = []
    for i in range(n_samples):
        score = 0
        if supplier_rating[i] < 70:
            score += 3
        if price_discrepancy[i] > 15:
            score += 2
        if temp_anomaly[i] == 1:
            score += 4
        if failed_scans[i] > 2:
            score += 2
            
        # Classify as high risk if score threshold met
        if score >= 4 or (supplier_rating[i] < 60 and price_discrepancy[i] > 20):
            y.append(1)
        else:
            y.append(0)
            
    X = np.column_stack((
        supplier_rating,
        price_discrepancy,
        temp_anomaly,
        failed_scans
    ))
    y = np.array(y)
    
    print(f"Data balance: {np.sum(y == 0)} Low Risk, {np.sum(y == 1)} High Risk")
    
    # Train test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Fitting Random Forest classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    accuracy = clf.score(X_test, y_test)
    print(f"Random Forest accuracy on test set: {accuracy:.4f}")
    
    # Save model
    with open(RANDOM_FOREST_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"Random Forest classifier saved to {RANDOM_FOREST_PATH}")

if __name__ == "__main__":
    train_isolation_forest()
    train_random_forest()
