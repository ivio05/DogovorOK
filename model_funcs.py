import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline, BitsAndBytesConfig
from pypdf import PdfReader
import docx
import time
import pymorphy3
import re
from splitter.splitter import SentenceSplitter

start_time = time.time()

def read_contract(name):
    ext = name.split('.')[1]
    text = ''
    try:
        if ext == 'docx':
            doc = docx.Document(name)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif ext == 'pdf':
            reader = PdfReader(name)
            for page in reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(e)
    return text

def law_factors(text):
    sent_re = re.compile(r'[^\.。]*[\.。]\s*')
    split_text = sent_re.findall(text)
    morph = pymorphy3.MorphAnalyzer()
    words = text.split()

    state_registration_base = [morph.parse('государственная')[0].normal_form,
                               morph.parse('регистрация')[0].normal_form]
    license_base = [morph.parse('лицензионное')[0].normal_form,
                               morph.parse('соглашение')[0].normal_form,
                               morph.parse('договор')[0].normal_form,
                               morph.parse('лицензиар')[0].normal_form,
                               morph.parse('лицензиат')[0].normal_form]
    rospatent_base = morph.parse('роспатент')[0].normal_form
    registration_term_base = [morph.parse('рабочие')[0].normal_form,
                         morph.parse('дни')[0].normal_form,
                         morph.parse('регистрация')[0].normal_form,
                         morph.parse('не')[0].normal_form,
                         morph.parse('позднее')[0].normal_form]
    competition_base = [morph.parse('запретить')[0].normal_form,
                         morph.parse('запрещать')[0].normal_form,
                         morph.parse('конкуренция')[0].normal_form]
    automatic_null_base = [morph.parse('автоматический')[0].normal_form,
                         morph.parse('прекращение')[0].normal_form,
                         morph.parse('расторжение')[0].normal_form]
    reward_base = [morph.parse('вознаграждение')[0].normal_form,
                         morph.parse('составляет')[0].normal_form,
                         morph.parse('устанавливается')[0].normal_form]
    one_sided_null_base = [morph.parse('односторонний')[0].normal_form,
                         morph.parse('расторгнуть')[0].normal_form,
                         morph.parse('объяснение')[0].normal_form,
                         morph.parse('причин')[0].normal_form]
    objection_base = [morph.parse('спор')[0].normal_form]
    duration_base = [morph.parse('срок')[0].normal_form,
                         morph.parse('действия')[0].normal_form,
                         morph.parse('вступать')[0].normal_form,
                         morph.parse('сила')[0].normal_form,
                         morph.parse('действовать')[0].normal_form]
    certificate_base = [morph.parse('свидетельство')[0].normal_form,
                               morph.parse('№')[0].normal_form]
    trademark_base = [morph.parse('товарный')[0].normal_form,
                               morph.parse('знак')[0].normal_form]

    state_registration_found = False
    rospatent_found = False
    registration_term_found = False
    license_found = False
    competition_found = False
    automatic_null_found = False
    reward_found = False
    one_sided_null_found = False
    objection_found = False
    duration_found = False
    certificate_found = False
    trademark_found = False

    registration_sent_index = -1
    registration_term_sent_index = -1


    for sent_index in range(len(split_text)):
        words = split_text[sent_index].split()
        parsed_words = []
        for word in words:
            parsed_words.append(morph.parse(word)[0].normal_form)
        if state_registration_base[0] in parsed_words and state_registration_base[1] in parsed_words:
            state_registration_found = True
            registration_sent_index = sent_index
        if license_base[0] in parsed_words and (license_base[1] in parsed_words or license_base[2] in parsed_words):
            license_found = True
        if not license_found:
            if license_base[3] in parsed_words or license_base[4] in parsed_words:
                license_found = True
        if rospatent_base in parsed_words:
            rospatent_found = True
        if (competition_base[0] in parsed_words or competition_base[1] in parsed_words) and competition_base[2] in parsed_words:
            competition_found = True
        if registration_term_base[0] in parsed_words and registration_term_base[1] in parsed_words and parsed_words.index(registration_term_base[1]) - parsed_words.index(registration_term_base[0]) == 1:
            registration_term_sent_index = sent_index
            if registration_term_sent_index - registration_sent_index < 5:
                registration_term_found = True
        if not registration_term_found:
            if registration_term_base[2] in parsed_words and registration_term_base[3] in parsed_words and registration_term_base[4] in parsed_words:
                registration_term_found = True
        if automatic_null_base[0] in parsed_words and (automatic_null_base[1] in parsed_words or automatic_null_base[2] in parsed_words):
            automatic_null_found = True
        if reward_base[0] in parsed_words and (reward_base[1] in parsed_words or reward_base[2] in parsed_words):
            reward_found = True
        if one_sided_null_base[0] in parsed_words and one_sided_null_base[1] in parsed_words and one_sided_null_base[2] in parsed_words and one_sided_null_base[3] in parsed_words:
            one_sided_null_found = True
        if objection_base[0] in parsed_words:
            objection_found = True
        if duration_base[0] in parsed_words and duration_base[1] in parsed_words or duration_base[2] in parsed_words and duration_base[3] in parsed_words and duration_base[4] in parsed_words:
            duration_found = True
        if certificate_base[0] in parsed_words and certificate_base[1] in parsed_words:
            certificate_found = True
        if trademark_base[0] in parsed_words and trademark_base[1] in parsed_words:
            trademark_found = True

    results = {
        "Не является ли документ лицензионным соглашением?": not license_found,
        "Отсутствует ли одностороннее расторжение без объяснения причин?": not one_sided_null_found,
        "Даются ли Пользователю права на товарный знак?" : trademark_found,
        "Отсутствует ли автоматическое расторжение?": not automatic_null_found,
        "Отсутствует ли запрет конкуренции?": not competition_found,
        "Имееется ли государственная регистрация?": state_registration_found or rospatent_found,
        "Указан ли размер вознаграждения?": reward_found,
        "Указаны ли рабочие дни?": registration_term_found,
        "Является ли Правообладатель юридическим лицом?" : True,
        "Указаны ли положения о претензионном порядке?": objection_found,
        "Указан ли срок действия договора?": duration_found,
        "Указан ли номер свидетельства правообладателя?": certificate_found
    }

    return results

def fin_factors(text):
    splitter = SentenceSplitter()
    splitter.load_model('splitter/sentence_splitter_model.pkl')
    sentences_raw = splitter.split_text(text)
    sentences = []
    for sent in sentences_raw:
        splitted_sent = sent.split('\n')
        for s_sent in splitted_sent:
            sentences.append(s_sent)
    royalty = 0
    paush = 0
    fine = 0

    for sent in sentences:
        was = -1
        sent_l = sent.lower()
        if ("вознаграждение" in sent_l or "роялти" in sent_l or "отчислен" in sent_l) and ("%" in sent_l or "процент" in sent_l):
            tokens = re.findall(splitter.pattern, sent)
            per = 0
            try:
                per = tokens.index("%") - 1
            except:
                for i, t in enumerate(tokens):
                    if "процент" in t:
                        per = i - 1
                        break
            r = ''
            if tokens[per] == ')':
                while per >= 0 and tokens[per] != '(':
                    per -= 1
            per -= 1
            while per >= 0 and tokens[per].isdigit():
                r = tokens[per] + r
                per -= 1


            if len(r) > 0:
                royalty = int(r)

        if ("паушальн" in sent_l) and "руб" in sent_l:
            tokens = re.findall(splitter.pattern, sent)
            per = tokens.index("руб") - 1
            was = per
            coef = 1
            if per >= 0 and tokens[per] == ".":
                per -= 1

            if per >= 0 and tokens[per] == "млн":
                coef = 1000000
                per -= 1
            elif per >= 0 and tokens[per] == "тыс":
                coef = 1000
                per -= 1

            if tokens[per] == ')':
                while per >= 0 and tokens[per] != '(':
                    per -= 1
            per -= 1
            p = ''
            while per >= 0 and tokens[per].isdigit():
                p = tokens[per] + p
                per -= 1
            if len(p) > 0:
                paush += int(p) * coef

        if ("штраф" in sent_l or "неустойк" in sent_l) and "руб" in sent_l:
            tokens = re.findall(splitter.pattern, sent)
            print(sent)
            per = tokens.index("руб") - 1
            if was == per:
                if len(tokens) <= per + 2:
                    continue
                per = tokens[per + 2:].index("руб")
            coef = 1
            if per >= 0 and tokens[per] == ".":
                per -= 1

            if per >= 0 and tokens[per] == "млн":
                coef = 1000000
                per -= 1
            elif per >= 0 and tokens[per] == "тыс":
                coef = 1000
                per -= 1

            if tokens[per] == ')':
                while per >= 0 and tokens[per] != '(':
                    per -= 1
            per -= 1

            f = ''
            while per >= 0 and tokens[per].isdigit():
                f = tokens[per] + f
                per -= 1
            if len(f) > 0:
                fine = max(fine, int(f) * coef)

    return {"Роялти" : royalty,
    "Паушальный взнос" : paush,
    "Максимальный штраф" : fine}

def check_contract(name):
    text = read_contract(name)
    # print(text)
    law = law_factors(text)
    fin = fin_factors(text)


    law_mark = 3

    if not law['Не является ли документ лицензионным соглашением?']:
        law_mark = 1
    elif not law['Отсутствует ли одностороннее расторжение без объяснения причин?']:
        law_mark = 1
    elif not law['Даются ли Пользователю права на товарный знак?']:
        law_mark = 1
    elif not law['Отсутствует ли автоматическое расторжение?']:
        law_mark = 1
    elif not law['Отсутствует ли запрет конкуренции?']:
        law_mark = 1
    elif not law['Указан ли номер свидетельства правообладателя?']:
        law_mark = 1
    elif not law['Имееется ли государственная регистрация?']:
        law_mark = 1
    elif not law['Указан ли размер вознаграждения?']:
        law_mark = 1
    elif not law['Указаны ли рабочие дни?']:
        law_mark = 2
    elif not law['Является ли Правообладатель юридическим лицом?']:
        law_mark = 2
    
    fin_mark = 3

    if fin["Роялти"] >= 35 or fin["Паушальный взнос"] >= 5000000 or fin["Максимальный штраф"] >= 1000000:
        fin_mark = 1
    elif fin["Роялти"] >= 15 or fin["Паушальный взнос"] >= 1000000 or fin["Максимальный штраф"] >= 500000:
        fin_mark = 2

    return law_mark, fin_mark, law, fin


# print(fin_factors(read_contract("doc2.pdf")))

# result = check_contract("files/ДОГОВОР КОММЕРЧЕСКОЙ КОНЦЕССИИ № 1.docx")
# print(result)

# legal_score, economic_score, legalFactors, economicFactors = check_contract("files/doc.pdf")
# print(legal_score)
