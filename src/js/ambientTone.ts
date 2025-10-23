export interface AmbientToneLayer {
  /**
   * Ratio relative to the base frequency. For example, 1.0 equals the base frequency,
   * 1.5 represents a perfect fifth, and so on.
   */
  ratio: number;
  /**
   * Gain applied to the layer in the range [0, 1]. Values are normalized internally.
   */
  gain: number;
  /**
   * Optional phase offset (0-1) to spread the layers slightly.
   */
  phase?: number;
}

export interface AmbientToneOptions {
  /** Base frequency of the tone in hertz. */
  baseFrequency: number;
  /** Duration of the generated clip in seconds. Defaults to 2.5s. */
  duration?: number;
  /** Sample rate. Defaults to 22050hz to keep payload small. */
  sampleRate?: number;
  /** Collection of harmonic layers to enrich the texture. */
  layers?: AmbientToneLayer[];
  /** Attack envelope portion (0-1). */
  attackPortion?: number;
  /** Release envelope portion (0-1). */
  releasePortion?: number;
}

const WAV_HEADER_BYTES = 44;

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const remainder = bytes.length % 3;
  const mainLength = bytes.length - remainder;
  let base64 = '';

  for (let i = 0; i < mainLength; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    base64 += BASE64_ALPHABET[(chunk >> 18) & 0x3f];
    base64 += BASE64_ALPHABET[(chunk >> 12) & 0x3f];
    base64 += BASE64_ALPHABET[(chunk >> 6) & 0x3f];
    base64 += BASE64_ALPHABET[chunk & 0x3f];
  }

  if (remainder === 1) {
    const chunk = bytes[mainLength];
    base64 += BASE64_ALPHABET[(chunk >> 2) & 0x3f];
    base64 += BASE64_ALPHABET[(chunk << 4) & 0x3f];
    base64 += '==';
  } else if (remainder === 2) {
    const chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    base64 += BASE64_ALPHABET[(chunk >> 10) & 0x3f];
    base64 += BASE64_ALPHABET[(chunk >> 4) & 0x3f];
    base64 += BASE64_ALPHABET[(chunk << 2) & 0x3f];
    base64 += '=';
  }

  return base64;
}

/**
 * Generates a short, loop-friendly ambient tone as a data URI that can be consumed by an HTMLAudioElement.
 */
export function generateAmbientToneDataUri({
  baseFrequency,
  duration = 2.5,
  sampleRate = 22050,
  layers = [
    { ratio: 1, gain: 1 },
    { ratio: 1.5, gain: 0.45, phase: 0.1 },
  ],
  attackPortion = 0.1,
  releasePortion = 0.2,
}: AmbientToneOptions): string {
  const totalSamples = Math.max(1, Math.floor(sampleRate * duration));
  const dataSize = totalSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataSize);
  const view = new DataView(buffer);
  const maxAmplitude = 0x7fff;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Channels
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate = SampleRate * NumChannels * BitsPerSample/8
  view.setUint16(32, 2, true); // BlockAlign = NumChannels * BitsPerSample/8
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const attackSamples = Math.floor(totalSamples * clamp01(attackPortion));
  const releaseSamples = Math.floor(totalSamples * clamp01(releasePortion));
  const sustainStart = attackSamples;
  const sustainEnd = totalSamples - releaseSamples;

  const totalGain = layers.reduce((sum, layer) => sum + layer.gain, 0) || 1;

  for (let i = 0; i < totalSamples; i += 1) {
    let amplitudeEnvelope = 1;
    if (i < sustainStart && sustainStart > 0) {
      amplitudeEnvelope = i / sustainStart;
    } else if (i > sustainEnd && releaseSamples > 0) {
      amplitudeEnvelope = 1 - (i - sustainEnd) / releaseSamples;
    }

    let sampleValue = 0;
    layers.forEach((layer) => {
      const phaseOffset = (layer.phase ?? 0) * 2 * Math.PI;
      const angularFrequency = 2 * Math.PI * baseFrequency * layer.ratio;
      sampleValue += Math.sin((angularFrequency * i) / sampleRate + phaseOffset) * layer.gain;
    });

    sampleValue = (sampleValue / totalGain) * amplitudeEnvelope;
    view.setInt16(WAV_HEADER_BYTES + i * 2, Math.floor(sampleValue * maxAmplitude), true);
  }

  const base64 = arrayBufferToBase64(buffer);
  return `data:audio/wav;base64,${base64}`;
}
