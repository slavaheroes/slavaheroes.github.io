---
title: MLOps Playground
date: 2022-08-15
description: MLOps Zoomcamp
tags: [Projects]
keywords: [Coding, MLOps]
featured: false
---

## Table of Contents
1. [Introduction](#introduction)
2. [Project Description](#project-description)
   - [Model Development](#model-development)
   - [Deployment and Monitoring](#deployment-and-monitoring)
3. [Best Practices](#best-practices)
4. [Certificate of Completion](#certificate-of-completion)

## Introduction

In 2022, I completed the [MLOps course](https://github.com/DataTalksClub/mlops-zoomcamp) organized by DataTalksClub. As my final project, I developed a Fake News Classification service using the techniques covered in the course.

You can find the complete project on GitHub: [MLOps Zoomcamp Project](https://github.com/slavaheroes/mlops-zoomcamp-project)

## Project Description

### Model Development

For this project, I used the [Kaggle Fake News dataset](https://www.kaggle.com/competitions/fake-news/overview) to classify articles as fake or genuine based on their title, author, and text.

The model development process involved the following steps:

1. **Data Cleaning**: I used the [nltk](https://www.nltk.org/) library to remove words with little meaning (like prepositions) using its stop words list. Additionally, I applied [stemming](https://www.nltk.org/howto/stem.html) to reduce words to their root form.

2. **Text Vectorization**: To represent documents as vectors, I utilized the [TfidfVectorizer from sklearn](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html). This tool converts text into a matrix of TF-IDF features.

3. **Model Selection**: I chose **Logistic Regression** as the classification method, using the implementation available in sklearn.

4. **Hyperparameter Tuning**: I used **hyperopt** to find the best set of hyperparameters through 3-fold cross-validation. The metrics were logged to **MLFlow**, and the best model was selected based on the F1 score.

### Deployment and Monitoring

I built a simple web service using **Flask** with custom HTML templates. The service is containerized using **Docker** and deployed locally.

The service supports two main routes:

1. **/** (Root):
   - GET request: Displays a form where users can input their own test cases.
   - POST request: Triggered by submitting the form. The model processes the input, makes a prediction, and returns the predicted label along with its probability. The input data and prediction are stored locally for monitoring purposes.

2. **/monitor**:
   - This page serves as a simple monitoring service using **evidently**.
   - After collecting sufficient data, it generates a dashboard with a DataDriftTab to analyze prediction labels and their probabilities.
   - The report is saved as an HTML file and can be viewed via a GET request.

## Best Practices

Throughout the project, I used several best practices:

- Unit tests (check the `tests` folder)
- Linter and Code formatter: I used **pylint**, **black**, and **isort** (see the **pyproject.toml** file)
- Makefile: Used to run important commands (check the **Makefile**)
- Pre-commit hooks: Implemented to format code and run tests (see **.pre-commit-config.yaml**)

## Certificate of Completion

[Certificate of completion](https://drive.google.com/file/d/1CGAlEzRXb4ieuj04f0usNdx4_h2MLT0x/view?usp=sharing)
