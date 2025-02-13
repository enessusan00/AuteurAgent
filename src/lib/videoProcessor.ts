import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

interface MediaInfo {
    duration: number;
    streams: {
        codec_type: string;
        duration?: number;
    }[];
}

async function getMediaInfo(filePath: string): Promise<MediaInfo> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve({
                duration: metadata.format.duration || 0,
                streams: metadata.streams.map(stream => ({
                    codec_type: stream.codec_type || '',
                    duration: stream.duration ? parseFloat(stream.duration) : undefined
                }))
            });
        });
    });
}

export async function combineAudioAndVideo(
    videoBuffer: Buffer,
    audioBuffer: Buffer,
    options: {
        targetDuration?: number;
        loop?: boolean;
    } = {}
): Promise<Buffer> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-processor-'));
    const tempVideoPath = path.join(tempDir, 'input.mp4');
    const tempAudioPath = path.join(tempDir, 'input.mp3');
    const outputPath = path.join(tempDir, 'output.mp4');

    try {
        // Write temporary files
        await fs.writeFile(tempVideoPath, videoBuffer);
        await fs.writeFile(tempAudioPath, audioBuffer);

        // Get media information
        const [videoInfo, audioInfo] = await Promise.all([
            getMediaInfo(tempVideoPath),
            getMediaInfo(tempAudioPath)
        ]);

        const videoDuration = videoInfo.duration;
        const audioDuration = audioInfo.duration;

        return new Promise((resolve, reject) => {
            let command = ffmpeg();
            if (videoDuration < audioDuration) {
                command = command
                    .input(tempVideoPath)
                    .inputOptions([`-stream_loop ${Math.ceil(audioDuration / videoDuration) - 1}`]);
            } else {
                command = command.input(tempVideoPath);
            }
            command.input(tempAudioPath)
                .outputOptions([
                    '-c:v copy',          // Copy video codec
                    '-c:a aac',           // Use AAC for audio
                    '-map 0:v:0',         // Use first video stream from first input
                    '-map 1:a:0',         // Use first audio stream from second input
                    '-shortest'           // Finish encoding when shortest input ends
                ])
                .output(outputPath)
                .on('end', async () => {
                    try {
                        const outputBuffer = await fs.readFile(outputPath);
                        await cleanupTempFiles();
                        resolve(outputBuffer);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', async (err) => {
                    await cleanupTempFiles();
                    reject(err);
                })
                .run();
        });
    } catch (error) {
        await cleanupTempFiles();
        throw error;
    }

    async function cleanupTempFiles() {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }
}