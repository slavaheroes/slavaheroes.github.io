---
layout: post
title: Capstone Project for 5-Day Gen AI Intensive Course
date: 2025-04-20
description: RAG & LLM Agents built using LlamaIndex & LangGraph
tags: [Projects, Agents]
keywords: [Coding, RAG, GenAI course]
featured: true
---

# 🧠 Explain Like I'm 5 (ELI5) a YouTube Video — Powered by RAG & LLM Agents

After completing the [**GenAI 5-Day Course by Google and Kaggle**](https://www.kaggle.com/learn-guide/5-day-genai), I wanted to put what I learned into practice.

Sooo, using **GPT-4o**, I *vibe-coded* the following project in two days.

The result is a system that takes YouTube video, fetches the transcript, and explains it back to you [like you're five](https://www.reddit.com/r/explainlikeimfive/) (or at least helps you to generate anologies) — using smart retrieval, LLM routing, and ELI5-style generation.

🧪 **Check out the full Kaggle Notebook here → [link](https://www.kaggle.com/code/vyacheslavshen/genai-capstone-eli5-youtube-video-w-llm-agents#Explain-me-Like-I'm-5-(ELI5)-a-YouTube-video-with-RAG-and-LLM-Agents)**


## 📌 TL;DR

> This project takes a YouTube link + a question, and answers it like you're five — using a clever pipeline of retrieval, agent routing, and Gemini's LLM magic.

## 📚 Table of Contents

- [✨ Motivation](#-motivation)
- [⚙️ How It Works](#️-how-it-works)
- [🧱 Key Components](#-key-components)
  - [Vector DB Creation](#vector-db-creation)
  - [Routing & Agents](#routing--agents)
- [📺 Example Runs](#-example-runs)
- [🧪 Discussion & Conclusion](#-discussion--conclusion)
  - [🚫 Limitations](#-limitations)
  - [🔮 Future Work](#-future-work)

## ✨ Motivation

Inspired by the **Feynman Technique**, this project started with a simple idea: *If you can explain something simply, you understand it well*. But crafting good analogies isn't always easy — so I wondered, "Could LLMs help generate simple, intuitive explanations?"

The result is a pipeline that breaks down complex YouTube content into explanations even a 5-year-old could follow.

## ⚙️ How It Works

1. **You provide a YouTube link and a question.**
2. **Transcripts** are fetched using the YouTube API via proxy (to avoid cloud IP blocks).
3. **Vector embeddings** are created using LlamaIndex + FAISS.
4. A **LangGraph** routes your query:
   - Simple → LLM response.
   - Contextual → RAG-based retrieval.
   - Summary → Full transcript summarization.
   - Missing info → Web search fallback.
5. **Gemini** generates an ELI5 response.


## 🧱 Key Components

### Vector DB Creation
We use `LLamaIndex` with `SentenceSplitter` for basic chunking and embed with either:
- HuggingFace (`all-MiniLM-L6-v2`) for local inference
- Google Gemini for API-based, high-quality embeddings

All chunks are stored in a **FAISS** vector store for fast retrieval. 

```python
def process_document(doc: Document, use_google: bool = False) -> Tuple[List, BaseEmbedding]:

    parser = SentenceSplitter(chunk_size=512, chunk_overlap=150)
    nodes = parser.get_nodes_from_documents([doc])

    logger.info(f"🔍 Using {'Google Gemini' if use_google else 'HuggingFace'} embedding model")

    if use_google:
        embed_model = GoogleGenAIEmbedding(
            model_name="models/embedding-001",  # or "text-embedding-004" depending on access
            embed_batch_size=100,
        )
    else:
        embed_model = HuggingFaceEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            embed_batch_size=100
        )

    return nodes, embed_model

def get_query_engine(
    nodes: List, 
    embed_model: BaseEmbedding, 
    embed_dim: int, 
    persist_dir: Optional[str] = None,
    rebuild: bool = False
):
    if persist_dir and os.path.exists(persist_dir) and not rebuild:
        logger.info(f"🔄 Loading index from: {persist_dir}")
        storage_context = StorageContext.from_defaults(persist_dir=persist_dir)
        index = load_index_from_storage(storage_context, embed_model=embed_model)

    else:
        logger.info("🧠 Creating new FAISS index with L2 similarity")
        faiss_index = faiss.IndexFlatL2(embed_dim)
        vector_store = FaissVectorStore(faiss_index=faiss_index)

        index = VectorStoreIndex(
            nodes=nodes,
            embed_model=embed_model,
            vector_store=vector_store
        )

        if persist_dir:
            logger.info(f"💾 Saving index to: {persist_dir}")
            index.storage_context.persist(persist_dir=persist_dir)

    return index.as_query_engine(similarity_top_k=5)
```

### Routing & Agents
Built using **LangGraph**, the system routes user queries using the following agents:
- `llm_router`: Classifies queries into `simple`, `need_rag`, or `summary`
- `llm_answer`: Directly answers simple factual questions
- `rag_pipeline`: Retrieves transcript chunks and generates an answer
- `llm_summarizer_node`: Summarizes the full video transcript
- `web_search_agent`: Fetches external context when transcript lacks relevant info

Each agent calls a shared prompt engine (`llm_answer_node_core`) that formats the prompt and generates a response in ELI5 style.

```python
def build_langgraph() -> Callable:
    builder = StateGraph(State)

    # Add all functional nodes
    builder.add_node("llm_router", llm_router_node)
    builder.add_node("llm_answer", llm_answer_node)
    builder.add_node("llm_summarizer_node", llm_summarizer_node)
    builder.add_node("rag_pipeline", rag_pipeline_node)
    builder.add_node("web_search_agent", web_search_agent_node)

    # Define the entry point of the graph
    builder.add_edge(START, "llm_router")

    # Routing logic based on QuestionType Enum
    builder.add_conditional_edges(
        "llm_router",
        lambda state: state["route"].value,
        {
            "simple": "llm_answer",
            "summary": "llm_summarizer_node",
            "need_rag": "rag_pipeline"
        }
    )

    # If RAG fails, route to web search; otherwise, go to answer
    builder.add_conditional_edges(
        "rag_pipeline",
        lambda state: state["route"].value if isinstance(state["route"], QuestionType) else state["route"],
        {
            "llm_answer": "llm_answer",
            "web_search_agent": "web_search_agent"
        }
    )

    # Define end points
    builder.add_edge("llm_answer", END)
    builder.add_edge("llm_summarizer_node", END)
    builder.add_edge("web_search_agent", END)

    return builder.compile()
```

## 📺 Example Runs

I tested the system on two trending GenAI topics (I attached some answers of the system):

1. [How LLMs Work – 3Blue1Brown](https://www.youtube.com/watch?v=LPZh9BOjkQs)

> "A large language model is like a super smart robot that read all your storybooks and knows how words go together. When you ask it something, it makes a new story from all those words!"

2. [Diffusion Models – Ari Seff](https://www.youtube.com/watch?v=fbLgFrlTnGU)

> "Imagine you covered a picture with snow. Diffusion models are like magic erasers that slowly remove the snow until the picture appears. They can even start with just snow and imagine a new picture!"

## 🧪 Discussion & Conclusion

This system showcases how LLM agents can simplify complex topics using retrieval, routing, and clever prompting. But it's not without limits.

### 🚫 Limitations

- Over-simplification: Sometimes analogies hide technical depth — prompt tuning could help.

- Transcript-only summaries: Visual or tonal context is missing from LLM outputs.

- No citations or sources: Would be helpful for deeper learners.

- No follow-up interaction: Doesn't ask clarifying questions or adapt to the user's level.

### 🔮 Future Work

Now that I have $300 in free Google Cloud credits, I'd like to extend this project into a fully functional web application with additional capabilities:

- PDF Ingestion & Reasoning

Enable users to upload and ask questions about external documents (e.g., research papers, manuals, slide decks), using the same ELI5-style interface.

- Visual Explanations

Integrate AI-generated diagrams or visual metaphors alongside text-based answers to make explanations even more intuitive and engaging.
