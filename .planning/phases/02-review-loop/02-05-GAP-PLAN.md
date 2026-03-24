---
phase: 02-review-loop
plan: "05-GAP"
type: fix
wave: 1
depends_on: []
files_modified:
  - src/components/capture/AudioRecorder.tsx
  - src/app/api/audio/transcribe/route.ts
autonomous: true
requirements: [AUDIO-01]

must_haves:
  truths:
    - "SiliconFlow SenseVoice API only accepts WAV/MP3, not webm"
    - "Web Audio API can decode webm and encode to WAV in browser"
  artifacts:
    - path: "src/components/capture/AudioRecorder.tsx"
      provides: "WebM to WAV conversion before upload"
    - path: "src/app/api/audio/transcribe/route.ts"
      provides: "Updated to accept audio/wav mime type"
  key_links:
    - from: "AudioRecorder onstop"
      to: "convertWebmToWav function"
      via: "Blob conversion before signed URL upload"
---

<objective>
Fix audio transcription by converting webm recording to WAV format before upload, as SiliconFlow SenseVoice API does not support webm.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/02-review-loop/02-05-SUMMARY.md
@.planning/phases/02-review-loop/02-GAPS.md

**Problem**: User testing revealed that uploading webm audio fails with "mime type audio/webm is not supported" from SiliconFlow API.

**Solution**: Use Web Audio API to decode the webm Blob and re-encode as standard WAV (16kHz, mono, 16-bit) which is universally supported by speech recognition APIs.
</context>

<tasks>

<task order="1">
**Add webm-to-WAV conversion utility to AudioRecorder**

File: `src/components/capture/AudioRecorder.tsx`

Add before the component:
```typescript
// WAV encoder helper for speech recognition APIs
async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Resample to 16kHz mono for optimal speech recognition
  const targetSampleRate = 16000;
  const offlineContext = new OfflineAudioContext(
    1, // mono
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();
  return audioBufferToWav(renderedBuffer);
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const dataLength = buffer.length * numberOfChannels * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write interleaved data
  const offset = 44;
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }

  let index = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
```

Then modify the `onstop` handler to convert before uploading:
```typescript
mediaRecorder.onstop = async () => {
  const webmBlob = new Blob(chunksRef.current, { type: selectedMimeType });

  // Convert webm to WAV for API compatibility
  setStatus("converting");
  const wavBlob = await convertWebmToWav(webmBlob);

  // Update file extension for signed URL
  const wavPath = audioPathRef.current.replace(/\.webm$/, ".wav");
  audioPathRef.current = wavPath;

  // Continue with upload using wavBlob...
};
```

Add "converting" to the Status type and UI string mapping.
</task>

<task order="2">
**Update transcribe route to accept WAV and update file extension handling**

File: `src/app/api/audio/transcribe/route.ts`

The route already downloads from Storage and sends to API. Ensure:
1. File extension detection handles `.wav`
2. Mime type for wav is `audio/wav`

Current code should work, just verify the extension parsing:
```typescript
const ext = audioPath.split(".").pop() ?? "wav";
const mimeType = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : `audio/${ext}`;
```
</task>

<task order="3">
**Update signed-url route to accept .wav extension**

File: `src/app/api/audio/signed-url/route.ts`

Ensure the path generation supports .wav:
```typescript
const path = `${user.id}/${Date.now()}.wav`; // Changed from .webm
```

Or keep dynamic based on client-provided extension if implemented.
</task>

</tasks>

<verification>

## Self-Check

- [ ] Recording produces valid WAV file that plays in audio player
- [ ] SiliconFlow API accepts the WAV and returns transcription
- [ ] Transcribed text appears in the capture text input

</verification>

<success_criteria>
- AudioRecorder converts webm to WAV before upload
- Transcribe route successfully processes WAV files
- End-to-end audio recording → transcription → text population works
</success_criteria>
