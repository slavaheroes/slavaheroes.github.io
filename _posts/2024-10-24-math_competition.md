---
layout: post
title: LLM Solves Math
date: 2024-10-24
description: LLM Zoomcamp 2024 Math Competition
tags: [Projects, LLMs, Kaggle Competitions]
keywords: [Coding, LLMs]
featured: true
---

# LLM Zoomcamp Competition Solution Write-up

## Table of Contents
1. [Competition Overview](#competition-overview)
2. [Data Description](#data-description)
3. [Solution Approaches](#solution-approaches)
   - [3.1 Automatic Chain of Thought & Code](#solution-1-automatic-chain-of-thought--code)
   - [3.2 Self-Verification System](#solution-2-self-verification-system)
   - [3.3 Ensemble Method](#solution-3-ensemble-method)
4. [Results](#results)

## Competition Overview

The [LLM Zoomcamp Competition](https://www.kaggle.com/competitions/llm-zoomcamp-2024-competition/), hosted by DataTalksClub, ended three weeks ago. 
Participants were tasked with solving mathematics problems from the *Russian State Exam* (ЕГЭ), a standardized test required for admission to Russian universities and professional colleges. The problems were provided in English, translated from Russian using GPT-4. **Manual solving was not permitted** - solutions had to be generated programmatically or using LLMs.

For additional solutions and approaches, please refer to the [official blog post](https://datatalks.club/blog/winning-solutions-from-llm-zoomcamp-2024-competition.html). 

## Data

The dataset consisted of:
- 100 training problems (with answers)
- 100 test problems (with answers)
- 100 unchecked problems (without verified answers)

All problems were provided in both English and Russian. An example, please look at the problem  with id of 7135 in the train set:
> The harmonic mean of three numbers $$ a $$, $$ b $$, and $$ c $$ is calculated using the formula $$ h=\left(\frac{\frac{1}{a} +\frac{1}{b} +\frac{1}{c} }{3} \right)^{-1} $$. Find the harmonic mean of the numbers $$ \frac{1}{9} $$, $$ \frac{1}{10} $$, and $$ \frac{1}{11} $$.
> Answer: `0.1`

## Solution Approaches

### Solution 1. Automatic Chain of Thought & Code

By quickly skimming over the problems in the train and test set, I noticed that the problems are clustered around several mathematical topics with significant overlap in their structure and solution approaches. Thus, I printed all the train questions to `std_output`, then, copied and passed them to GPT4o, asking it to find 20 unique problems covering different topics.

Using GPT4o's web interface, I solved these problems and wrote accompanying Python code for each solution to dynamically create few-shot prompts. You can find the solutions in the [`few_shot_prompts.json`](https://drive.google.com/file/d/1w3sn32_mnOPtdJDUVq-COFaORIu4JmGx/view?usp=sharing) file. Here is an example:

> Question: Find the value of the expression $$ \frac{14}{11} + \frac{17}{10} \cdot \frac{11}{15} $$.
> 
> `Explanation`: First, we add (14/11) + (17/10) because they are in the brackets.
>
>Next, we multiply the result by (11/15).
>
> In python code, it will be:
```python
result = ((14/11) + (17/10)) * (11/15)
print('Answer is: ', result)
```
>
> `Code output`: "Answer is:  `2.1799999999999997`"

Using Elastic Search, I indexed all the solutions, and for a given question from the test dataset, I dynamically constructed prompts as follows:
1. Retrieve the three most similar questions from the solved examples
2. Generate a combined few-shot prompt and call the LLM API
3. Extract and execute the Python code using regex and Python's `exec` command
4. Process the results through a final LLM pass for answer validation

In [`test_set_gpt4o-mini_answer.csv`](https://drive.google.com/file/d/1sdjZJrs-neSl8Q133jZcSGsFLpJd8rTG/view?usp=sharing) file, you can find all few-shot prompts, LLM answers, and code outputs.

Below is an example of one prompt:

> Here are some examples of how to answer correspondence questions:
>
>Q: Find the value of the expression $$ \frac{17}{5} :\frac{34}{3} +1.3 $$
>Solution: 
>The colon operator means division. Thus, (17/5) / (35/3).
>Next, we add result to 1.3: (17/5) / (35/3) + 1.3.
>
>In python code, it will be:
>```python
>result = (17/5) / (34/3) + 1.3
>print('Answer is: ', result)
>```
>Code output:
> `Answer is:  1.6`
>Hence, the final answer is 1.6
> ... `2 more examples`
>Now, please solve this new problem:
>Q: Find the value of the expression \\(4.8 \cdot 2.5\\).

LLM gave the code below, which I executed and parsed the answer:
```python
result = 4.8 * 2.5
print('Answer is: ', result)
```

### Solution 2. Self-Verification System

This solution is shared on the [Kaggle](https://www.kaggle.com/code/vyacheslavshen/double-check-with-llms).

I noticed that the bottleneck of `Solution 1` is that there are some problems which cannot be solved by the code, like logic problems.
Therefore, I changed the approach as follows:
1. Directly ask the LLM to solve a problem with `Let's think step by step` prompting
2. Adding a verification step where the LLM reviews and potentially corrects its initial solution

Notably, this self-verification approach achieved the same accuracy metrics as the code-based solution (`Solution 1`).

For transparency, I've made the complete LLM outputs available in [this csv file](https://drive.google.com/file/d/1MRvN8VZwJsZf7iobQKbjwRxu68_YXcrG/view?usp=sharing).

### Solution 3. Ensemble Method

The final solution combined the previous two approaches:
1. Identify problems where the approaches above disagree
2. Random selection

Between `Solution 1` and `Solution 2`, there are 10 mismatches, so for these 10 problems, I randomly took 5 answers from `Solution 1`, and 5 answers from `Solution 2`.
The code below shows how I did:
```python
solution1, solution2 # pd.Dataframes
solution = solution1[solution1['answer'] == solution2['answer']]
mismatch = solution1[solution1['answer'] != solution2['answer']]
N = 5 # hyperparameter
mask = np.concatenate([np.ones(N), np.zeros(len(mismatch) - N)]) np.random.shuffle(mask)
mismatch['answer'] = np.where(mask, solution1.loc[mismatch.index, 'answer'], solution2.loc[mismatch.index, 'answer'])

solution = pd.concat([solution, mismatch])
```

## Results 

- `Solution 1` and `Solution 2` both had 87.5% public score 
- The `Solution 3` improved the public score from 87.5% to 90%
- However, in the private set all solutions scored **95.0 %**.
