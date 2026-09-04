import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score,
    precision_score, recall_score, f1_score, confusion_matrix, brier_score_loss
)
from features import get_preprocessor, NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET

def evaluate_model(model, X, y):
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)[:, 1]
    
    metrics = {
        'roc_auc': float(roc_auc_score(y, y_prob)),
        'pr_auc': float(average_precision_score(y, y_prob)),
        'accuracy': float(accuracy_score(y, y_pred)),
        'precision': float(precision_score(y, y_pred)),
        'recall': float(recall_score(y, y_pred)),
        'f1': float(f1_score(y, y_pred)),
        'brier_score': float(brier_score_loss(y, y_prob)),
        'confusion_matrix': confusion_matrix(y, y_pred).tolist()
    }
    return metrics

def train():
    # Paths
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_path = os.path.join(base_dir, 'data', 'synthetic', 'training_dataset.csv')
    model_dir = os.path.join(base_dir, 'ai', 'model')
    os.makedirs(model_dir, exist_ok=True)
    
    # Load dataset
    df = pd.read_csv(data_path)
    
    # Validation checks
    assert TARGET in df.columns
    assert "amount_recovered" not in df.columns
    assert "transaction_id" in df.columns
    
    # Prepare X and y
    # We drop 'transaction_id' here. We only keep requested numeric/categorical features.
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]
    
    # Split 70/15/15 using stratification
    # First split off 30% for val/test
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42
    )
    # Then split the 30% into 15% val / 15% test
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )
    
    # Define models to try
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
    }
    
    preprocessor = get_preprocessor()
    
    best_model_name = None
    best_pipeline = None
    best_val_auc = -1
    best_val_metrics = None
    
    results = []
    
    for name, clf in models.items():
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', clf)
        ])
        
        pipeline.fit(X_train, y_train)
        
        val_metrics = evaluate_model(pipeline, X_val, y_val)
        
        results.append({
            'Model': name,
            'ROC-AUC': val_metrics['roc_auc'],
            'PR-AUC': val_metrics['pr_auc'],
            'Accuracy': val_metrics['accuracy'],
            'Precision': val_metrics['precision'],
            'Recall': val_metrics['recall'],
            'F1': val_metrics['f1'],
            'Brier Score': val_metrics['brier_score']
        })
        
        # Priority: ROC-AUC, PR-AUC, Recall, Calibration (Brier Score - lower is better)
        # Using ROC-AUC as primary selection
        if val_metrics['roc_auc'] > best_val_auc:
            best_val_auc = val_metrics['roc_auc']
            best_pipeline = pipeline
            best_model_name = name
            best_val_metrics = val_metrics
    
    # Evaluate best model on test set
    test_metrics = evaluate_model(best_pipeline, X_test, y_test)
    
    # Save the model
    model_path = os.path.join(model_dir, 'recovery_model.joblib')
    joblib.dump(best_pipeline, model_path)
    
    # Save metadata
    metadata = {
        "model_name": best_model_name,
        "training_date": datetime.utcnow().isoformat(),
        "dataset_size": len(df),
        "feature_names": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "target_name": TARGET,
        "train_size": len(X_train),
        "val_size": len(X_val),
        "test_size": len(X_test),
        "validation_metrics": best_val_metrics,
        "test_metrics": test_metrics,
        "random_seed": 42,
        "model_version": "1.0.0"
    }
    
    meta_path = os.path.join(model_dir, 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    # Print results
    print("=== MODEL TRAINING REPORT ===")
    print(f"1. Dataset shape: {df.shape}")
    print(f"2. Train/validation/test sizes: {len(X_train)} / {len(X_val)} / {len(X_test)}")
    
    # 3. Class distribution
    dist = y.value_counts(normalize=True)*100
    print(f"3. Class distribution:\n   0 (Not Recovered): {dist[0]:.2f}%\n   1 (Recovered): {dist[1]:.2f}%")
    
    print("\n4. Model comparison table (Validation):")
    results_df = pd.DataFrame(results)
    print(results_df.to_string(index=False))
    
    print(f"\n5. Best model: {best_model_name}")
    print("\n6. Validation metrics:")
    for k, v in best_val_metrics.items():
        if k != 'confusion_matrix':
            print(f"   {k}: {v:.4f}")
            
    print("\n7. Test metrics:")
    for k, v in test_metrics.items():
        if k != 'confusion_matrix':
            print(f"   {k}: {v:.4f}")
            
    print(f"\n8. Test Confusion matrix:\n{np.array(test_metrics['confusion_matrix'])}")
    print(f"\n9. Model file path: {model_path}")
    print("\n10. Confirmation:")
    print("   No leakage features were used.")
    print("   'transaction_id' and all post-recovery fields were actively excluded.")
    print("   This model strictly outputs probability based on pre-recovery state.")

if __name__ == '__main__':
    train()
