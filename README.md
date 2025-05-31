# 🧠 Systematic Review & Meta-Analysis Assistant

Welcome to the Systematic Review & Meta-Analysis Assistant — a modern AI-powered web application that simplifies and accelerates the process of conducting evidence-based literature reviews in line with PRISMA standards. Built with React, FastAPI, and OpenRouter AI, this app is designed for clinicians, researchers, and students aiming to streamline their research workflow.

---

## ✨ Features

- 🔐 Secure Authentication: Simple login system using JWT tokens for access control.
- 📋 PICOT Protocol Builder: Create structured research questions using the Population, Intervention, Comparator, Outcome, and Time framework.
- 🔎 AI-Assisted PubMed Search: Enter queries or PICOT-based questions and fetch relevant PubMed articles.
- 📚 Auto-Complete Suggestions: Smart suggestions as you type to help refine your clinical question.
- 🧠 AI-Powered Summaries: Abstract summarisation using LLaMA 3 via OpenRouter.
- 📊 Critical Appraisal & Data Extraction: Automatically extract metrics like sample size, effect size, outcomes, and CI.
- ✅ Include / ❌ Exclude Decisions: Track included and excluded studies with local storage persistence.
- 📄 Tabulated Results: Included studies are displayed in a clean, exportable table.
- 📂 Article Filtering: Filter search results by study design (RCT, Case-Control, etc.).
- 📤 Export & Reporting *(Planned)*: Export included articles and summaries for reporting.
- 🧾 PRISMA Flow Support *(Planned)*: Track counts and steps of the review process visually.

---

## 🛠️ Tech Stack

| Frontend | Backend | AI Integration | Auth | Storage |
|---------|---------|----------------|------|---------|
| React + Tailwind CSS | FastAPI | OpenRouter (LLaMA 3) | JWT | LocalStorage |

---

## 📦 Installation

### Prerequisites

- Node.js
- Python 3.10+
- OpenRouter API Key (for AI features)

### Clone the Repo

```bash
git clone https://github.com/yourusername/systematic-review-ai.git](https://github.com/lastshootingstar/Miron.git
cd miron

Frontend Setup

cd frontend
npm install
npm start

Backend Setup
bash
Copy
Edit
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Make sure to set your OpenRouter API key:

export OPENROUTER_API_KEY=your_api_key_here

🧪 Usage Guide

Login using admin / password123 (default dev credentials).

Head to the Systematic Review page.

Use the PICOT Builder to define your question.

Enter a query in the search box and get smart suggestions.

Fetch and screen articles.

Click ✅ or ❌ to include/exclude articles.

View extracted data and summaries in the Included Studies Table.

📌 Roadmap
 Search PubMed and fetch abstracts

 Summarize with LLaMA 3

 Extract structured data

 Include/exclude tracking

 Suggestions for query input

 Export selected studies to PDF/CSV

 PRISMA-style flow diagram

 Collaborative multi-user support

🤝 Contributing
We welcome contributions! If you’d like to:

Improve UI/UX

Add tests

Refine AI prompts

Build export functionality

Please open a PR or reach out!

📄 License
This project is licensed under the MIT License.

🙏 Acknowledgements
PubMed E-Utilities

OpenRouter

PRISMA Guidelines

🔗 Demo / Screenshots
Add screenshots and a demo link here when available


