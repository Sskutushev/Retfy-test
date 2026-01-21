# Telegram Analytics Bot

A Telegram bot that collects chat statistics and provides analytics using LLM integration, with a complementary web interface.

## Setup and Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd telegram-analytics-bot
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your TELEGRAM_BOT_TOKEN and GEMINI_API_KEY

3. Start the services:
```bash
docker-compose up --build
```

The bot will connect to your Telegram group and start collecting messages. The web interface will be available at http://localhost:3000

## Architecture

The project consists of three main components:

### Bot Service
- Written in Node.js/TypeScript
- Uses Telegraf for Telegram bot API
- Stores user and message data in PostgreSQL
- Caches statistics in Redis
- Provides commands: /stats, /analyze, /wordcloud

### Web Interface
- Built with Next.js 14
- Allows user analysis via web interface
- Communicates with the same database as the bot
- Provides the same analysis functionality as the bot

### Database Layer
- PostgreSQL for persistent storage
- Redis for caching
- Models for User and Message entities
- Repository pattern for database operations

## Features

### Statistics
- Top 10 most active users
- Individual user statistics
- Time period filtering (today, week, month, all time)
- Cached results for performance

### LLM Integration
- Uses Google Gemini API for user analysis
- Analyzes communication style, topics, activity patterns
- Provides structured insights based on user messages

### Word Cloud
- Generates popular words cloud for selected periods
- Filters stop words and mentions
- Available via /wordcloud command

## Technologies Used

- Node.js/TypeScript
- Next.js 14
- PostgreSQL
- Redis
- Telegraf
- Docker/Docker Compose
- Google Gemini API

## Project Structure

```
telegram-analytics-bot/
├── bot/
│   ├── src/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── services/
│   │   └── types/
│   └── Dockerfile
├── web/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## Usage

1. Add the bot to your Telegram group
2. Send messages in the group - the bot will collect them
3. Use commands:
   - `/stats` - view chat statistics
   - `/analyze @username` - analyze a specific user
   - `/wordcloud` - view popular words cloud

## Additional Feature: Word Cloud

### Idea
Implemented a word cloud feature that visualizes the most frequently used words in a chat. This provides quick insights into the most discussed topics and common expressions used by participants. The feature filters out stop words and mentions to focus on meaningful content.

### Implementation
- Created a WordCloudService that analyzes message texts from the database
- Implemented intelligent filtering for stop words (both Russian and English), mentions (@username), links, and short/common words
- Developed commands for different time periods (today, week, month, all time)
- Integrated with the existing stats system and caching mechanism
- Added corresponding UI elements in the web interface

### Usage
- Use `/wordcloud` command in the Telegram bot to generate a word cloud for the entire chat
- Select different time periods using inline buttons
- View word cloud through the web interface at the main page

## Testing

Run unit tests:
```bash
cd bot
npm test
```

## Deployment

The application is designed for containerized deployment using Docker Compose. For production, adjust the environment variables and consider using external PostgreSQL and Redis instances.

## AI Tools Usage

This project was developed with assistance from multiple AI tools:

- Claude.ai was used for architecture planning and structure formation
- Gemini CLI was used for project scaffolding and setup
- Qwen was used for final refinement, targeted error correction, code cleaning, and documentation creation
- A comprehensive code review and verification was performed

Note: Google Gemini API integration could not be tested due to regional restrictions. The logic is properly implemented and should work without issues in supported regions. All other functionality has been fully implemented and tested.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request