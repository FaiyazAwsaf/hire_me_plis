import tiktoken
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.ai.cv_pipeline.classifier import ClassifiedBlock

# cl100k_base is the tokeniser used by text-embedding-3-small
_enc = tiktoken.get_encoding("cl100k_base")


def _token_len(text: str) -> int:
    return len(_enc.encode(text))


@dataclass
class Chunk:
    section: str
    text: str
    chunk_index: int
    token_count: int  # computed here once; reused in embedder without recounting


def chunk_sections(classified: list[ClassifiedBlock]) -> list[Chunk]:
    """Split each classified section into ≤150-token chunks with 15-token overlap.

    The splitter only ever sees one section's text at a time, so chunks
    never span two sections (e.g. experience bled into education).
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=150,
        chunk_overlap=15,
        length_function=_token_len,
    )

    chunks = []
    for block in classified:
        sub_chunks = splitter.split_text(block.text)
        for i, text in enumerate(sub_chunks):
            chunks.append(
                Chunk(
                    section=block.section,
                    text=text,
                    chunk_index=i,
                    token_count=_token_len(text),
                )
            )
    return chunks
