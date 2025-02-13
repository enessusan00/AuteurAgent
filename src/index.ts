import { z } from 'zod'
import { Agent } from '@openserv-labs/sdk'
import express from 'express';
import { generateMusic, generateVideo } from './lib/replicate'
import { combineAudioAndVideo } from './lib/videoProcessor'
import 'dotenv/config'
const app = express();
const port = process.env.PORT || 7378;
app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', time: new Date().toISOString() });
});
const agent = new Agent({
  systemPrompt: 'You can write a song and generate musics about a given parameters and refenced song file. ',
  port: 7378,
})
// Add writeSong capability
agent.addCapability({
  name: 'writeLyrics',
  description: `Write a song lyrics about a given topic with exactly 1 verse and 1 chorus`,
  schema: z.object({
    inputs: z.object({
      topic: z.string().describe('The topic of the song'),
      language: z.string().describe('The language of the song').default('english')
    }),
    output: z.string().describe('The generated song')
  }),
  async run(params) {
    const prompt = `
    Create engaging and emotionally resonant song lyrics about ${params.args.inputs.topic} in ${params.args.inputs.language}. The song should:

1. Have exactly one verse and one chorus
2. Follow a clear narrative structure
3. Use vivid imagery and metaphors
4. Include emotional depth
5. Maintain consistent rhythm and meter
6. Be suitable for musical adaptation
7. Stay within 12-16 lines total
8. Include rhyming elements where appropriate
9. Focus on universal themes that connect to ${params.args.inputs.topic}
10. Be original and avoid clichés

Please write the lyrics in a flowing, natural style without labeling verse or chorus sections.

The tone should be [determine based on topic: upbeat/melancholic/inspirational/romantic] and the lyrics should evoke [specific emotion related to topic].

Remember to:
- Make the chorus memorable and catchy
- Use strong opening and closing lines
- Maintain consistent perspective (first/third person)
- Include sensory details
- Create emotional resonance with the audience`
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key is required')
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )
    interface GeminiResponse {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }
    const result = await response.json() as GeminiResponse
    if (result.candidates && result.candidates[0]?.content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]?.text) {
      return result.candidates[0].content.parts[0].text
    }
    throw new Error('Failed to generate lyrics')
  }
})

// Add music generation capability
agent.addCapability({
  name: 'generateMusic',
  description: 'Generate music based on given lyrics and a reference song',
  schema: z.object({
    inputs: z.object({
      lyrics: z.string().describe('lyrics to be used for music generation'),
      songFile: z.string().optional().describe('URL of the reference song file to be used in workspace. It should be a web URL'),
    }),
    outputFileName: z.string().optional().describe('Name of the output file to be saved in the workspace in mp3 format')
  }),
  async run({ args, action }) {
    if (!action) {
      throw new Error('No action context provided')
    }

    // Create a filename based on the first few words of lyrics or use provided name
    const fileName = args.outputFileName ||
      `${args.inputs.lyrics.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.mp3`

    // Generate the music
    const musicBuffer = await generateMusic({
      lyrics: args.inputs.lyrics,
      song_file: args.inputs.songFile
    })

    try {
      console.log('Saving music to workspace:', action.workspace.id)
      // Upload to workspace
      await agent.uploadFile({
        workspaceId: action.workspace.id,
        path: args.outputFileName || fileName,
        file: musicBuffer,
        skipSummarizer: true,
      })
      console.log('Music saved to workspace:', action.workspace.id)
      return `Music generated and saved to workspace as: ${fileName}`
    }
    catch (error) {
      console.error('Failed to save music to workspace:', error)
      return 'Failed to save music to workspace'
    }
  }
})
agent.addCapability({
  name: 'writeMusicVideoConcept',
  description: `Write a video concept based on a given song lyrics`,
  schema: z.object({
    inputs: z.object({
      topic: z.string().describe('lyrics of the song'),
    }),
    output: z.string().describe('The generated video concept')
  }),
  async run(params) {
    const prompt = `Create a detailed, cinematic music video concept based on these lyrics: ${params.args.inputs.topic}

The concept should include:

1. Visual Style:
- Specific color palette and lighting design
- Camera movements and transitions
- Visual effects or special techniques
- Aspect ratio and filming style

2. Scene Descriptions:
- Detailed location descriptions
- Time of day and weather conditions
- Character appearances and wardrobing
- Key props and set design elements

3. Narrative Elements:
- Story arc that complements the lyrics
- Character motivations and emotions
- Symbolic imagery and metaphors
- Transitions between scenes

4. Technical Specifications:
- Shot types (close-ups, wide shots, etc.)
- Key camera movements
- Lighting requirements
- Special effects needs

Keep the description vivid and specific, focusing on creating a cohesive visual story that enhances the emotional impact of the song. Limit to 256 words while maintaining detail and clarity.

Example format:
"A neon-lit urban street at twilight. [Specific details about location]. The camera [specific movement] as [detailed description of action]. The lighting shifts from [specific description] to create [intended emotional effect]..."`
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key is required')
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )
    interface GeminiResponse {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }
    const result = await response.json() as GeminiResponse
    if (result.candidates && result.candidates[0]?.content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]?.text) {
      return result.candidates[0].content.parts[0].text
    }
    throw new Error('Failed to generate video concept')
  }
})

agent.addCapability({
  name: 'generateMusicVideo',
  description: 'Generate music video based on given concept',
  schema: z.object({
    concept: z.string().describe('The concept of the music video'),
    videoName: z.string().optional().describe('Name of the output video file to be saved in the workspace in mp4 format'),
    output: z.string().describe('The generated video')
  }),
  async run({ args, action }) {
    if (!action) {
      throw new Error('No action context provided')
    }

    // Generate the music
    const videoBuffer = await generateVideo({
      prompt: args.concept,
    })

    try {
      console.log('Saving music to workspace:', action.workspace.id)
      // Upload to workspace
      await agent.uploadFile({
        workspaceId: action.workspace.id,
        path: args.videoName || 'music-video.mp4',
        file: videoBuffer,
        skipSummarizer: true,
      })
      console.log('Music saved to workspace:', action.workspace.id)
      return `Music generated and saved to workspace as: ${args.videoName}`
    }
    catch (error) {
      console.error('Failed to save music to workspace:', error)
      return 'Failed to save music to workspace'
    }
  }
})
// Add combine capability
agent.addCapability({
  name: 'combineAudioVideo',
  description: 'Combine audio and video files from workspace and save the output using ffmpeg',
  schema: z.object({
    audioFile: z.string().describe('Name of the audio file in workspace'),
    videoFile: z.string().describe('Name of the video file in workspace'),
    outputFile: z.string().describe('Name for the combined output file')
  }),
  async run({ args, action }) {
    if (!action) {
      throw new Error('No workspace context provided')
    }

    try {
      const files = await agent.getFiles({
        workspaceId: action.workspace.id
      });

      const audioFile = files.find((f: any) => f.path === args.audioFile);
      const videoFile = files.find((f: any) => f.path === args.videoFile);

      if (!audioFile?.fullUrl || !videoFile?.fullUrl) {
        throw new Error('Could not find audio or video file in workspace');
      }

      // Download files
      const [audioResponse, videoResponse] = await Promise.all([
        fetch(audioFile.fullUrl),
        fetch(videoFile.fullUrl)
      ]);

      if (!audioResponse.ok || !videoResponse.ok) {
        throw new Error('Failed to download files from workspace');
      }

      const [audioBuffer, videoBuffer] = await Promise.all([
        audioResponse.arrayBuffer(),
        videoResponse.arrayBuffer()
      ]);

      const combinedBuffer = await combineAudioAndVideo(
        Buffer.from(videoBuffer),
        Buffer.from(audioBuffer)
      );

      await agent.uploadFile({
        workspaceId: action.workspace.id,
        path: args.outputFile,
        file: combinedBuffer,
        skipSummarizer: true,
      });

      return `Combined video saved as: ${args.outputFile}`;
    } catch (error) {
      console.error('Failed to combine audio and video:', error);
      throw error;
    }
  }
});


async function createMusicVideoWorkflow(topic: string, uuid: string): Promise<void> {
  if (!process.env.WORKSPACE_ID) {
    throw new Error('WORKSPACE_ID is required')
  }

  const workspaceId = parseInt(process.env.WORKSPACE_ID)

  // Task 1: Write lyrics
  const writeLyricsTask = await agent.createTask({
    workspaceId,
    assignee: 230,
    body: `Create professional-quality song lyrics about "${topic}" that:
    - Tell a compelling story
    - Use vivid imagery and metaphors
    - Have exactly one verse and one chorus
    - Maintain consistent rhythm and meter
    - Include emotional resonance
    Please focus on creating memorable, impactful lyrics that will translate well to both music and video.`,
    description: `Create emotionally resonant lyrics about ${topic}`,
    input: topic,
    expectedOutput: `Polished, production-ready lyrics saved as ${uuid}_lyrics.txt`,
    dependencies: []
  })

  // Task 2: Generate video concept
  const generateConceptTask = await agent.createTask({
    workspaceId,
    assignee: 230,
    body: `Create a detailed music video concept that:
    - Matches the emotional tone of the lyrics
    - Includes specific visual direction
    - Details camera movements and transitions
    - Specifies lighting and color schemes
    - Describes locations and set design
    - Outlines character appearances
    - Video will be 10 seconds long so write a concept that fits this duration.
    Maximum 256 words while maintaining necessary detail.`,
    description: 'Create cinematic music video concept',
    input: `${uuid}_lyrics.txt`,
    expectedOutput: `Detailed video concept saved as ${uuid}_concept.txt`,
    dependencies: [writeLyricsTask.id]
  })

  // Task 3: Generate music
  const generateMusicTask = await agent.createTask({
    workspaceId,
    assignee: 230,
    body: 'Generate music using the lyrics',
    description: 'Create music',
    input: `${uuid}_lyrics.txt`,
    expectedOutput: `Music saved as ${uuid}_music.mp3`,
    dependencies: [writeLyricsTask.id]
  })

  // Task 4: Generate video
  const generateVideoTask = await agent.createTask({
    workspaceId,
    assignee: 230,
    body: 'Generate video based on the concept',
    description: 'Create video',
    input: `${uuid}_concept.txt`,
    expectedOutput: `Video saved as ${uuid}_video.mp4`,
    dependencies: [generateConceptTask.id]
  })

  // Task 5: Combine audio and video
  const combineTask = await agent.createTask({
    workspaceId,
    assignee: 230,
    body: 'Combine music and video with ',
    description: 'Create final music video',
    input: `${uuid}_music.mp3 and ${uuid}_video.mp4`,
    expectedOutput: `Final video saved as ${uuid}_final.mp4`,
    dependencies: [generateMusicTask.id, generateVideoTask.id]
  })
}


// Start workflow function
export async function startMusicVideoCreation(topic: string) {
  const uuid = Date.now().toString();
  await createMusicVideoWorkflow(topic, uuid);
  return uuid;
}
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// Start the agent's HTTP server
// agent.start()
