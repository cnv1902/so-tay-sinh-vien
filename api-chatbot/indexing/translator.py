import logging
import time
from typing import Optional, Tuple
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

_translators = {
    'en': GoogleTranslator(source='vi', target='en'),
    'lo': GoogleTranslator(source='vi', target='lo'),
}

def translate_text(text: Optional[str], target_lang: str = 'en', source_lang: str = 'vi', max_retries: int = 3) -> Optional[str]:
    """
    Dịch văn bản tiếng Việt sang target_lang ('en' hoặc 'lo').
    Hỗ trợ chia nhỏ văn bản dài, retry khi gặp sự cố mạng, và fallback an toàn.
    Chi phí: 0 token AI (Miễn phí 100%).
    """
    if not text or not text.strip():
        return text

    clean_text = text.strip()
    if target_lang == source_lang:
        return clean_text

    CHUNK_SIZE = 4000

    def _translate_single_chunk(chunk: str, lang: str) -> str:
        for attempt in range(1, max_retries + 1):
            try:
                translator = _translators.get(lang)
                if not translator or translator.target != lang:
                    translator = GoogleTranslator(source=source_lang, target=lang)
                    _translators[lang] = translator
                
                result = translator.translate(chunk)
                return result if result else chunk
            except Exception as e:
                logger.warning(f"Lỗi dịch (lần {attempt}/{max_retries}) sang '{lang}': {e}")
                if attempt < max_retries:
                    time.sleep(1.0 * attempt)
                else:
                    logger.error(f"Dịch thất bại sau {max_retries} lần thử sang '{lang}'. Trả về văn bản gốc.")
                    return chunk
        return chunk

    if len(clean_text) <= CHUNK_SIZE:
        return _translate_single_chunk(clean_text, target_lang)

    paragraphs = clean_text.split('\n')
    translated_paragraphs = []
    current_chunk = []
    current_length = 0

    for p in paragraphs:
        if current_length + len(p) + 1 > CHUNK_SIZE:
            chunk_str = '\n'.join(current_chunk)
            translated_paragraphs.append(_translate_single_chunk(chunk_str, target_lang))
            current_chunk = [p]
            current_length = len(p)
        else:
            current_chunk.append(p)
            current_length += len(p) + 1

    if current_chunk:
        chunk_str = '\n'.join(current_chunk)
        translated_paragraphs.append(_translate_single_chunk(chunk_str, target_lang))

    return '\n'.join(translated_paragraphs)


def translate_to_en_and_lao(text: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Dịch cùng lúc sang cả Tiếng Anh và Tiếng Lào.
    Trả về: (text_en, text_lao)
    """
    if not text or not text.strip():
        return None, None
    
    text_en = translate_text(text, target_lang='en')
    text_lao = translate_text(text, target_lang='lo')
    return text_en, text_lao
