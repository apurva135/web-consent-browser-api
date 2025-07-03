import pandas as pd
import re
import numpy as np
import joblib
from sklearn.linear_model import SGDClassifier
from sklearn.feature_extraction.text import TfidfVectorizer  # Using TfidfVectorizer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
import nltk
from nltk.corpus import stopwords
from pathlib import Path

# Download necessary NLTK resources
nltk.download('stopwords')

def clean_text(text):
    """Clean text by lowering case and removing special characters and stopwords."""
    text = text.lower()
    text = re.sub(r'[/(){}\[\]\|@,;]', ' ', text)
    text = re.sub(r'[^0-9a-z #+_]', '', text)
    stop_words = set(stopwords.words('english'))
    return ' '.join(word for word in text.split() if word not in stop_words)

def prepare_data(csv_file_path):
    """Load and preprocess data."""
    df = pd.read_csv(csv_file_path, encoding='latin1')
    df['Question'] = df['Question'].str.replace('�', "'")
    df['Processed Question'] = df['Question'].apply(clean_text)
    df['Target'] = df['Answer'].apply(lambda x: 1 if x == 'accept' else 0)
    return df

def train_online(model, X_train, y_train):
    """Train the model using SGDClassifier with TF-IDF."""
    vec = TfidfVectorizer(preprocessor=clean_text)  
    features = vec.fit_transform(X_train)  
    model.partial_fit(features, y_train, classes=np.array([0, 1]))
    return model, vec  

def evaluate_model(model, vec, X_test, y_test):
    """Evaluate the model and print the classification report using the trained vectorizer."""
    features = vec.transform(X_test)  
    predictions = model.predict(features)
    print(classification_report(y_test, predictions))

def train_model():
    CSV_FILE_PATH = 'consent.csv'
    MODEL_FILE_PATH = 'consent_model_incremental.pkl'
    
    
    model_file = Path(MODEL_FILE_PATH)
    if model_file.exists():
        model_file.unlink()
        print(f"Existing model file '{MODEL_FILE_PATH}' removed.")
    
    df = prepare_data(CSV_FILE_PATH)
    X_train, X_test, y_train, y_test = train_test_split(df['Processed Question'], df['Target'], test_size=0.2, random_state=42)
    
    model = SGDClassifier(loss='log_loss')
    model, vec = train_online(model, X_train, y_train)
    evaluate_model(model, vec, X_test, y_test)
    
    
    joblib.dump((model, vec), MODEL_FILE_PATH)  
    print("Model trained and saved successfully.")

if __name__ == "__main__":
    train_model()
