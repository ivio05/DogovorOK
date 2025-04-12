from transformers import pipeline, AutoTokenizer, AutoModelForQuestionAnswering
import torch

# Загружаем модель и токенизатор
model_name = "sberbank-ai/ruBert-small-qa"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForQuestionAnswering.from_pretrained(model_name)
qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer)

# Текст договора (пример)
contract_text = """
Сторона А обязуется поставить товар в срок до 30.06.2024. 
В случае задержки Сторона А выплачивает пеню в размере 0.1% от суммы договора за каждый день просрочки.
Сторона Б несет ответственность за повреждение товара при транспортировке.
Форс-мажорные обстоятельства освобождают обе стороны от ответственности.
"""

# Вопрос для поиска рисков
question = "Какие риски есть в этом тексте?"

# Параметры скользящего окна
CHUNK_SIZE = 128 # Размер чанка в токенах (меньше 512 для rubert-tiny2)
OVERLAP = 32       # Перекрытие между чанками

# Функция для разбиения текста на чанки
def sliding_chunks(text, chunk_size, overlap):
    tokens = tokenizer.encode(text, add_special_tokens=False)
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk = tokens[i:i + chunk_size]
        yield tokenizer.decode(chunk, skip_special_tokens=True)

# Обрабатываем каждый чанк и получаем ответы
risks = []
for chunk in sliding_chunks(contract_text, CHUNK_SIZE, OVERLAP):
    result = qa_pipeline(question=question, context=chunk)
    if result["score"] > 0.1:  # Фильтр по уверенности модели
        risks.append(result["answer"])

# Удаляем дубликаты и выводим уникальные риски
unique_risks = list(set(risks))
print("Выявленные риски:")
for risk in unique_risks:
    print(f"- {risk}")