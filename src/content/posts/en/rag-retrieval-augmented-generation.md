---
title: 'Retrieval-Augmented Generation (RAG): Patterns and Common Mistakes'
pubDate: 2026-08-18
description: 'A practical guide to Retrieval-Augmented Generation: why it exists, how the chunking-embeddings-search-rerank-prompt pipeline works, and the mistakes teams keep making in production RAG systems.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagram representing a retrieval-augmented generation pipeline.'
tags: ['AI', 'LLM', 'RAG']
transitionSlug: 'rag-retrieval-augmented-generation'
---

## Why RAG Exists

Large language models are frozen at training time and store their "knowledge" inside billions of parameters. That creates two practical problems: the model doesn't know anything that happened after training, and it can't access your private data (internal docs, tickets, codebases) because that data was never part of the training set. Fine-tuning a model on private data is expensive, has to be repeated every time the data changes, and doesn't reliably teach a model new facts so much as new patterns of speech.

Retrieval-Augmented Generation, introduced by Lewis et al. (Facebook AI Research, 2020) in ["Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"](https://arxiv.org/abs/2005.11401), proposes a different architecture: pair a parametric model (the LLM) with a non-parametric memory (a retriever over an external corpus, originally a dense vector index over Wikipedia). Instead of asking the model to recall facts from its weights, you retrieve the relevant passages at query time and feed them into the context window. The original paper reported that this combination beat both pure parametric models and task-specific retrieve-and-extract systems on open-domain QA benchmarks, and produced more specific and factual text than generation from parameters alone.

The practical payoff for application builders: you can ground answers in a document set that changes daily, cite sources, and update knowledge by re-indexing instead of retraining.

## The Basic Pipeline

A typical production RAG system has five stages:

1. **Chunking** — split source documents into smaller passages, because you can't (and shouldn't) embed an entire document as one vector.
2. **Embeddings** — convert each chunk into a dense vector using an embedding model.
3. **Vector search** — at query time, embed the user's question and retrieve the nearest chunks from a vector index (or combine with keyword search like BM25).
4. **Re-ranking** — pass the retrieved candidates, along with the raw query, through a more expensive but more accurate model that reorders them by actual relevance.
5. **Prompt assembly** — insert the top-ranked chunks into the LLM's context window alongside the user's question and generate the final answer.

```
query ──► embed ──► vector search (top-k) ──► rerank (top-n) ──► prompt assembly ──► LLM answer
                          ▲
                 chunked, embedded
                    document store
```

Each stage is a place where quality can be won or lost, which is exactly where most teams run into trouble.

## Common Mistake #1: Bad Chunking Strategy

Chunking looks trivial and rarely is. Pinecone's [guide to chunking strategies](https://www.pinecone.io/learn/chunking-strategies/) recommends starting with fixed-size chunking as a baseline, but notes the real tension: chunks need to be "big enough to contain meaningful information, while small enough to enable performant applications." Split too small and a chunk loses the surrounding context needed to make sense of it; split too large and you dilute the specific fact a query is looking for, hurting embedding precision. The guide suggests testing chunk sizes (commonly in the 128–1024 token range) against real queries rather than picking one number and moving on.

There's a subtler version of this problem: even well-sized chunks can be _ambiguous_ out of context. Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) post gives the canonical example — a chunk that says "revenue grew by 3%" is useless without knowing which company or quarter it refers to. Their fix is to prepend a short LLM-generated context blurb to each chunk before embedding and indexing it (both for the vector embedding and for BM25). In their evaluations, contextual embeddings alone cut retrieval failure rate by 35%, and combining contextual embeddings with contextual BM25 cut it by 49% (from 5.7% to 2.9% failed retrievals at top-20).

## Common Mistake #2: Skipping Re-ranking

Many teams ship a RAG system that goes straight from vector search to the prompt. The problem, as explained in Pinecone's [rerankers guide](https://www.pinecone.io/learn/series/rag/rerankers/), is that vector embeddings are a lossy compression: a bi-encoder has to squeeze every possible meaning of a chunk into a single vector, without knowing the actual query in advance. That produces a candidate set that's _semantically_ similar but not necessarily the _most relevant_ to what the user asked.

A reranker (typically a cross-encoder) fixes this with a second, more expensive pass: it looks at the raw query and each candidate document together, rather than comparing precomputed vectors, and reorders the top candidates by actual relevance. Running a cross-encoder over an entire corpus would be far too slow — the guide cites over 50 hours to score 40 million records that vector search handles in under 100ms — so the standard pattern is two-stage: cheap vector search narrows millions of documents to a few dozen, then the reranker re-scores just that shortlist. Anthropic's numbers make the payoff concrete: adding reranking on top of contextual retrieval took their failure rate reduction from 49% to 67% (down to 1.9%).

## Common Mistake #3: Stale Indexes

A RAG system is only as current as its index. If the underlying documents change — a policy is updated, a ticket is resolved, code is refactored — and the vector store isn't re-embedded and re-indexed, the model will confidently retrieve and cite outdated information. This is easy to overlook because nothing _fails_: the pipeline still runs, still returns chunks, still generates a plausible-sounding answer. Treat index freshness as a first-class operational concern (incremental re-indexing on document change, TTLs, or scheduled full rebuilds), not an afterthought bolted on after the first version ships.

## Common Mistake #4: Confusing Retrieval Relevance with Answer Quality

It's tempting to treat "did we retrieve the right chunks" and "was the final answer good" as the same question, but they're separate failure modes that need separate evaluation. A system can retrieve perfectly relevant passages and still generate a wrong or hallucinated answer if the model misreads or ignores the context, or if the prompt buries the key chunk under too much irrelevant material. Conversely, a system can retrieve mediocre chunks and still produce a plausible-looking answer that's actually ungrounded — which is worse, because it _looks_ trustworthy. Evaluate retrieval quality (precision/recall of relevant chunks) and end-to-end answer quality (faithfulness to the retrieved context, correctness) as two separate metrics, not one blended "it seemed to work" judgment.

## Conclusion

RAG exists to solve a real constraint: LLMs can't know everything, and retraining them every time your data changes isn't viable. The pipeline — chunk, embed, search, rerank, assemble — is conceptually simple, but each step has failure modes that only show up under real usage: chunks that strip away context, retrieval sets that are similar but not relevant, indexes that quietly go stale, and answers that look grounded but aren't. None of these are exotic problems; they're the ordinary cost of shipping a retrieval system, and the fixes (contextual chunking, two-stage reranking, freshness pipelines, separate evaluation of retrieval vs. generation) are well documented by the teams who've hit them first.
