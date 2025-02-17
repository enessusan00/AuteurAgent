# Auteur - AI Music Video Creator

A cutting-edge AI agent built with [OpenServ Labs SDK](https://github.com/openserv-labs/sdk) that transforms any topic into a complete music video. Auteur combines multiple AI capabilities to generate original song lyrics, create music, and produce matching visuals, delivering a fully automated music video creation experience.

## Features

- 🎵 Generates original song lyrics from any topic
- 🎹 Creates musical compositions to match the lyrics
- 🎬 Produces thematic video content
- 🎨 Automatically synchronizes audio and video
- 🎥 Handles complete end-to-end music video production

## Prerequisites

### 1. Required API Keys
- OpenServ API key (Get it from [OpenServ Platform](https://platform.openserv.ai))
- Replicate API key (Get it from [Replicate](https://replicate.com))
- Gemini API key (Get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 2. System Requirements
- Node.js 18 or higher
- FFmpeg installed on your system

## Setup

1. Clone this repository:
```bash
git clone https://github.com/enessusan00/AuteurAgent.git
cd AuteurAgent
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API keys:
```env
REPLICATE_API_TOKEN=your_replicate_api_token
OPENSERV_API_KEY=your_openserv_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=7378
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Usage on OpenServ Platform

1. Create an Agent:
   - Go to Developer -> Add Agent
   - Name: "Auteur"
   - Add comprehensive capabilities description
   - Set endpoint URL to your deployed instance

2. Create a Project:
   - Go to Projects -> Create New Project
   - Add your topic or theme
   - Add Auteur to the project
   - Run the project

3. The agent will generate:
   - Original song lyrics
   - Musical composition
   - Thematic video
   - Final combined music video

## Deployment

### Railway Deployment

1. Push your code to GitHub

2. Configure Railway:
   - Connect your GitHub repository
   - Add environment variables
   - Deploy using the included Dockerfile

### Local Deployment

For local development with tunneling:
```bash
# Using ngrok
ngrok http 7378
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main entry point
│   ├── lib/
│   │   ├── replicate.ts  # Replicate API integration
│   │   └── videoProcessor.ts # FFmpeg video processing
├── Dockerfile            # Container configuration
├── railway.toml         # Railway deployment config
└── package.json
```


## Build

Create production build:
```bash
npm run build
npm start
```

## Technical Details

- **Framework**: OpenServ Labs SDK
- **Language**: TypeScript
- **Video Processing**: FFmpeg
- **AI Models**:
  - Text Generation: Google Gemini
  - Music & Video: Replicate Models

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenServ Labs SDK for the agent framework
- Replicate for AI models
- FFmpeg for video processing

## Support

For support, please visit:
- [OpenServ Documentation](https://docs.openserv.ai)
- [GitHub Issues](https://github.com/enessusan00/AuteurAgent/issues)