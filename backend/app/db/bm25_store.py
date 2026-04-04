from pinecone_text.sparse import BM25Encoder
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BM25_PATH = os.path.join(BASE_DIR, "bm25.json")
CORPUS_PATH = os.path.join(BASE_DIR, "bm25_corpus.json")


def fit_and_save_bm25(texts: list[str]):
    if os.path.exists(CORPUS_PATH):
        with open(CORPUS_PATH, "r") as f:
            corpus = json.load(f)
    else:
        corpus = []

    corpus.extend(texts)

    with open(CORPUS_PATH, "w") as f:
        json.dump(corpus, f)

    bm25 = BM25Encoder()
    bm25.fit(corpus)
    bm25.dump(BM25_PATH)


def get_or_create_bm25() -> BM25Encoder:
    if os.path.exists(BM25_PATH):
        return BM25Encoder().load(BM25_PATH)
    return BM25Encoder.default()
