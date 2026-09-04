import os
import joblib
import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, brier_score_loss
from sklearn.model_selection import train_test_split
from features import NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET

def evaluate():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_path = os.path.join(base_dir, 'data', 'synthetic', 'training_dataset.csv')
    model_path = os.path.join(base_dir, 'ai', 'model', 'recovery_model.joblib')
    
    if not os.path.exists(model_path):
        print("Model not found. Run train.py first.")
        return
        
    df = pd.read_csv(data_path)
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]
    
    # Re-create the exact same split to get the test set
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )
    
    pipeline = joblib.load(model_path)
    
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    
    print("=== TEST SET EVALUATION REPRODUCTION ===")
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print(f"PR-AUC: {average_precision_score(y_test, y_prob):.4f}")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall: {recall_score(y_test, y_pred):.4f}")
    print(f"F1 Score: {f1_score(y_test, y_pred):.4f}")
    print(f"Brier Score: {brier_score_loss(y_test, y_prob):.4f}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

if __name__ == '__main__':
    evaluate()
