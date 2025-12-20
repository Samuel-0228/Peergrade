# PeerGrade Analyzer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Supabase](https://img.shields.io/badge/Supabase-Active-blue.svg)](https://supabase.com)

A lightweight tool to analyze PeerGrade feedback data, generate insights, and visualize trends in student assessments. Export your PeerGrade CSV, upload it, and get automated summaries, charts, and exportable reports.

## Features
- **Data Import**: Upload PeerGrade CSV exports and auto-parse into structured sessions.
- **Analysis Engine**: Compute metrics like average scores, feedback sentiment, and response distributions.
- **Visual Insights**: Interactive charts (bar, pie, line) for grading trends, question breakdowns, and peer dynamics using Chart.js.
- **Export Options**: Download summaries as JSON/CSV or shareable public links.
- **Backend**: Powered by Supabase for secure, scalable storage with Row Level Security.

## Quick Start
1. **Clone the Repo**:
   ```
   git clone https://github.com/yourusername/peergrade-analyzer.git
   cd peergrade-analyzer
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Set Up Environment**:
   - Create a `.env` file with your Supabase credentials:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     ```
   - Run database setup: `npm run db:setup` (creates tables for sessions and analyses).

4. **Run the App**:
   ```
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to upload data and view insights.

## Usage
- **Upload CSV**: Select a PeerGrade export file—app auto-detects columns like `student_id`, `question`, `grade`, `feedback`.
- **Generate Insights**: Click "Analyze" to process data into sessions. View dashboards with:
  - Score histograms.
  - Sentiment analysis on feedback (via simple NLP).
  - Top questions by engagement.
- **Share**: Toggle public mode for embeddable reports.

Example Output:
- **Chart**: Bar graph of average grades per question.
- **Summary**: "Session XYZ: 85% positive feedback, avg score 7.2/10."

## Tech Stack
- **Frontend**: Next.js + React + Chart.js
- **Backend**: Supabase (PostgreSQL + Auth)
- **Data Processing**: Pandas (via optional Python scripts)

## Contributing
Fork, branch, and PR! Issues welcome for new viz types or integrations.

## License
MIT © 2025 [Your Name]. See [LICENSE](LICENSE) for details.

---

*Built for educators—turn raw feedback into actionable insights!* 🚀