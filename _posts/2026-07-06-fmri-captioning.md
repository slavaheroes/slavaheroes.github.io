---
title: Interpretable fMRI Captioning via Contrastive Learning
date: 2026-07-06
description: Our MICCAI 2025 paper on generating text descriptions from brain activity using BLIP-2 and contrastive learning
tags: [Projects, Research]
keywords: [fMRI, Contrastive Learning, VLM]
featured: true
---

Our paper **"Interpretable fMRI Captioning via Contrastive Learning"** has been accepted at [MICCAI 2025](https://papers.miccai.org/miccai-2025/paper/2049_paper.pdf). In this post I give a short summary of the methodology and main results.

**Paper**: [https://papers.miccai.org/miccai-2025/paper/2049_paper.pdf](https://papers.miccai.org/miccai-2025/paper/2049_paper.pdf)

**Code**: [https://github.com/slavaheroes/brain-decoding-with-blip2](https://github.com/slavaheroes/brain-decoding-with-blip2)

---

## Methodology

We propose a two-stage training framework that maps fMRI brain signals to the compact latent representations of BLIP-2, a vision-language model. The key idea is to leverage BLIP-2's Q-Former, which compresses image features from $257 \times 1024$ down to $32 \times 768$ — much smaller than what prior methods (MindEye-2, Brain Diffuser) tried to predict, making the mapping from fMRI voxels far more tractable.

### Stage 1: Feature Extraction & Brain Model

A stimulus image is encoded by BLIP-2's image encoder and compressed via the Q-Former into a $32 \times 768$ embedding. We train a Brain Model (Ridge Regression) to map the $15{,}764$-dimensional fMRI voxel vector to each channel of these embeddings.

![Stage 1: fMRI voxels are mapped to BLIP-2 Q-Former embeddings through a Brain Model trained with MSE loss.](/assets/img/fmri-captioning/stage_1.png)

### Stage 2: Contrastive Alignment

We add contrastive learning to align the Brain Model outputs with text embeddings. Ground-truth COCO captions are processed through the Q-Former's self-attention layers to produce text embeddings. A combined loss drives this stage:

$$\mathcal{L} = \lambda_1 \mathcal{L}_{\text{MSE}}(b, i) + \lambda_2 \mathcal{L}_{\text{CLIP}}(b, t) + \lambda_3 \mathcal{L}_{\text{CLIP}}(i, t)$$

- **MSE loss** preserves alignment between predicted brain embeddings $b$ and ground-truth image embeddings $i$
- **Brain–text contrastive loss** aligns $b$ with text embeddings $t$, enabling text retrieval
- **Image–text contrastive loss** prevents catastrophic forgetting in the Q-Former

![Stage 2: Contrastive learning aligns brain embeddings with both image and text representations.](/assets/img/fmri-captioning/stage_2.png)

### Inference

At inference time, fMRI data is mapped to Q-Former embeddings by the Brain Model, projected, and fed into OPT-2.7B to generate captions.

![Inference pipeline: Brain Model maps fMRI to BLIP-2 embeddings, which are decoded by OPT-2.7B into text.](/assets/img/fmri-captioning/decoding_scheme.png)

---

## Results

### Table 1 — Retrieval Accuracy

Top-1 retrieval accuracies (subject 1). **I, B, T** = Image, Brain, Text. **I→B** means retrieving the correct image given fMRI, etc.

| Model | I→B | B→I | T→B | B→T |
|:---|:---:|:---:|:---:|:---:|
| Stage 1 | 0.437 | 0.222 | — | — |
| Stage 2 | 0.722 | 0.549 | **0.496** | **0.450** |
| MindEye-2 | **1.000** | **0.997** | — | — |
| MindEye-1 | 0.972 | 0.947 | — | — |
| Brain Diffuser | 0.188 | 0.263 | — | — |

Stage 2 significantly boosts retrieval over Stage 1, and — unlike MindEye — also enables **text↔brain retrieval** (49.6% and 45.0% among 300 candidates), unlocking natural-language querying of fMRI data.

### Table 2 — fMRI Captioning

Captioning performance comparison (subject 1).

| Model | Meteor | Rouge-1 | Rouge-L | Sentence | CLIP-B | CLIP-L |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| Stage 1 | 0.303 | 0.443 | 0.407 | 0.447 | 0.742 | 0.639 |
| Stage 2 | **0.327** | **0.467** | **0.430** | **0.515** | **0.771** | 0.674 |
| MindEye-2 | 0.248 | 0.326 | 0.353 | 0.479 | 0.737 | 0.638 |
| UniBrain | 0.170 | 0.247 | 0.225 | — | — | **0.861** |

Stage 2 achieves the best performance in 5 out of 6 metrics. Even Stage 1 alone already outperforms MindEye-2 on all linguistic metrics.

### Qualitative Comparison

The Stage 2 model generates more precise descriptions — correctly identifying "zebras" instead of "horses", "buses" instead of "a train", and "on a wave" instead of "on a beach":

![Qualitative comparison between Stage 1 and Stage 2 captions. Red text highlights key improvements.](/assets/img/fmri-captioning/stage_12_comparison.png)
