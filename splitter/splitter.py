import re
from collections import defaultdict
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics import f1_score
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import pickle

class SentenceSplitter:
    """Класс с основной моделью"""
    def __init__(self):
        self.model = None
        self.candidates = ['.', '!', '?']
        self.abbreviations = set()
        self.pattern = re.compile(
            r"""
            \d+
            | \w+
            | \n
            | [.!?]
            | \S
            """,
            re.VERBOSE
        )
    
    def build_abbreviation_dict(self, corpus, threshold=2):
        """Автоматическое создание словаря сокращений"""
        abbrevs = defaultdict(int)
        for text in corpus:
            tokens = re.findall(r'\S+', text)
            for i, token in enumerate(tokens[:-1]):
                if token.endswith('.') and len(token) > 1 and tokens[i+1][0].islower():
                    abbrevs[token.lower()] += 1
        self.abbreviations = {k for k,v in abbrevs.items() if v >= threshold}

    
    def extract_features(self, text):
        """Извлечение признаков для всех кандидатов в границы предложений"""
        tokens = re.findall(self.pattern, text)
        features = []
        prev_candidate = None
        for i, token in enumerate(tokens):
            if token in self.candidates:
                left = tokens[i-1] if i > 0 else None
                left_left = tokens[i-2] if i > 1 else None
                right = tokens[i+1] if i < len(tokens)-1 else None
                right_right = tokens[i+2] if i < len(tokens)-2 else None
                
                feature = {
                    'punct': token,
                    'prev_candidate': prev_candidate,
                    'left_word': left.lower() if left else None,
                    'right_word': right.lower() if right else None,
                    'left_left_word': left_left.lower() if left_left else None,
                    'right_right_word': right_right.lower() if right_right else None,
                    'left_is_upper': left[0].isupper() if left and left[0].isalpha() else False,
                    'right_is_upper': right[0].isupper() if right_right and right_right and right_right[0].isalpha() else False,
                    'left_left_is_upper': left_left[0].isupper() if left_left and left_left[0].isalpha() else False,
                    'right_right_is_upper': right_right[0].isupper() if right_right and right and right[0].isalpha() else False,
                    'left_is_abbrev': left.lower() in self.abbreviations if left else False,
                    'left_is_number': bool(re.match(r'^[\d,.]+$', left)) if left else False,
                    'left_has_digit': any(c.isdigit() for c in left) if left else False,
                    'right_is_capital': right[0].isupper() if right else False,
                    'next_is_quote': right in {'"', "'", '«', '»'} if right else False,
                    'prev_is_punct': bool(re.match(r'^[\W_]+$', left)) if left else False,
                    'token_length': len(token),
                    'left_length': len(left) if left else 0,
                    'right_length': len(right) if right else 0,
                }
                
                prev_candidate = token
                features.append((i, feature))
        return features
    
    def train(self, texts, labels):
        """Обучение модели на размеченных данных"""
        self.build_abbreviation_dict(texts)
        
        X = []
        y = []
        for text, text_labels in zip(texts, labels):
            features = self.extract_features(text)
            for (idx, feat), label in zip(features, text_labels):
                X.append(feat)
                y.append(label)
        self.model = Pipeline([
            ('vectorizer', DictVectorizer()),
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('classifier', RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42))
        ])
        
        self.model.fit(X, y)
        y_pred = self.model.predict(X)
        f1 = f1_score(y, y_pred, average='binary')
        print(f"Training F1-score: {f1:.4f}")
    
    def split_text_label(self, text):
        """Получение вектора результатов для текста"""
        features = self.extract_features(text)
        
        label = []
        for _, feat in features:
            label.append(self.model.predict([feat])[0])
        return label
    
    def split_text(self, text):
        """Разбивает полученный текст на предложения"""
        labels = self.split_text_label(text)

        indices = [i for i, x in enumerate(list(text)) if x in self.candidates]

        add = 1
        before_sent_ids = 0
        sentences = []
        t_sentences = []
        for i, ind in enumerate(indices):
            if labels[i] == 1:
                if (len(text) > (ind + add + 1)) and text[ind + add] == ' ':
                    text = text[:ind + add] + '\n' + text[ind + add + 1:]
                    sentences.append(text[before_sent_ids:ind + add])
                    before_sent_ids = ind + add + 1
                text = text[:ind + add] + '\n' + text[ind + add:]
                add += 1
        if before_sent_ids < len(text) - 1:
            sentences.append(text[before_sent_ids: len(text) - 1])
            t_sentences.append(re.findall(self.pattern, text[before_sent_ids: len(text) - 1]))
        
        return sentences

    def save_model(self, path):
        """Сохранение модели в файл"""
        with open(path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'abbreviations': self.abbreviations
            }, f)
    
    def load_model(self, path):
        """Загрузка модели из файла"""
        with open(path, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.abbreviations = data['abbreviations']
        
# splitter = SentenceSplitter()
# texts = []
# labels = []

# marked_files_num = 6
# for test in range(marked_files_num):
#     splitter = SentenceSplitter()
#     for i in range(marked_files_num):
#         if i == test:
#             continue
#         text, label = splitter.load_marked_data(f"raw_text/{i + 1}.txt", f"labels/{i + 1}.txt")
#         texts.append(text)
#         labels.append(label)
#     splitter.train(texts, labels)

#     y_pred = splitter.split_file_label(f"raw_text/{test + 1}.txt")
#     text, y = splitter.load_marked_data(f"raw_text/{test + 1}.txt", f"labels/{test + 1}.txt")
#     print("Validation F1-score on ", test + 1, ': ', f1_score(y, y_pred, average='binary'))

# for i in range(marked_files_num):
#     text, label = splitter.load_marked_data(f"raw_text/{i + 1}.txt", f"labels/{i + 1}.txt")
#     texts.append(text)
#     labels.append(label)
# splitter.train(texts, labels)

# splitter.split_file("raw_text/1.txt")
# splitter.save_model('sentence_splitter_model.pkl')
    