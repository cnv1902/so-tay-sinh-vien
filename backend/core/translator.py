import logging
import time
from typing import Optional, Tuple
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

# Cache translators in memory
_translators = {
    'en': GoogleTranslator(source='vi', target='en'),
    'lo': GoogleTranslator(source='vi', target='lo'),
}

import unicodedata

def clean_text_for_translation(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    # Chuẩn hóa Unicode NFC để tránh lỗi ký tự tổ hợp
    normalized = unicodedata.normalize("NFC", text.strip())
    # Loại bỏ ký tự hỏng replacement char nếu có
    return normalized.replace("\ufffd", "")

def translate_text(text: Optional[str], target_lang: str = 'en', source_lang: str = 'vi', max_retries: int = 3) -> Optional[str]:
    """
    Dịch văn bản tiếng Việt sang target_lang ('en' hoặc 'lo').
    Hỗ trợ chia nhỏ văn bản dài, retry khi gặp sự cố mạng, và fallback an toàn.
    Chi phí: 0 token AI (Miễn phí 100%).
    """
    clean_text = clean_text_for_translation(text)
    if not clean_text:
        return text

    if target_lang == source_lang:
        return clean_text

    CHUNK_SIZE = 3500

    def _translate_single_chunk(chunk: str, lang: str) -> str:
        for attempt in range(1, max_retries + 1):
            try:
                # Tạo mới translator per request hoặc reuse
                translator = GoogleTranslator(source=source_lang, target=lang)
                result = translator.translate(chunk)
                if result and result.strip():
                    return result.strip()
            except Exception as e:
                logger.warning(f"Lỗi dịch (lần {attempt}/{max_retries}) '{chunk[:30]}...' sang '{lang}': {e}")
                if attempt < max_retries:
                    time.sleep(1.0 * attempt)
                else:
                    logger.error(f"Dịch thất bại sau {max_retries} lần thử sang '{lang}'.")
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
    clean_text = clean_text_for_translation(text)
    if not clean_text:
        return None, None
    
    text_en = translate_text(clean_text, target_lang='en')
    text_lao = translate_text(clean_text, target_lang='lo')
    return text_en, text_lao

