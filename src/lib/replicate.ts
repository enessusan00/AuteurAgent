import Replicate from 'replicate'

interface MusicGenerationInput {
    lyrics: string
    song_file?: string
}
interface VideoGenerationInput {
    prompt: string
}

export async function generateMusic(input: MusicGenerationInput): Promise<Buffer> {
    const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
    })

    if (!input.song_file) {
        input.song_file = "https://replicate.delivery/pbxt/M9zum1Y6qujy02jeigHTJzn0lBTQOemB7OkH5XmmPSC5OUoO/MiniMax-Electronic.wav"
    }

    const output = await replicate.run("minimax/music-01", { input })

    // Convert output to Buffer
    const response = await fetch(output as any)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
}

export async function generateVideo(prompt: VideoGenerationInput): Promise<Buffer> {
    const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
    })
    const input = {
        ...prompt,
        aspect_ratio: "16:9",
        negative_prompt: "low quality, worst quality, deformed, distorted, watermark,text,lyrics,subtitles,logo,ugly",
        length: 257,
        cfg:3
    }
    const output = await replicate.run("lightricks/ltx-video:8c47da666861d081eeb4d1261853087de23923a268a69b63febdf5dc1dee08e4", { input })

    // Convert output to Buffer
    const response = await fetch(output as any)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
}
