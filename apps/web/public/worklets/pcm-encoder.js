class PCMEncoderProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.sampleRate = 16000
    this.channelCount = 1
    this.bufferSize = 1024
    this.buffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (!input || input.length === 0) return true

    const inputChannel = input[0]
    if (!inputChannel) return true

    // Resample from 48000Hz to 16000Hz (simple decimation)
    const decimationFactor = 48000 / this.sampleRate
    
    for (let i = 0; i < inputChannel.length; i += decimationFactor) {
      const sampleIndex = Math.floor(i)
      if (sampleIndex < inputChannel.length) {
        this.buffer[this.bufferIndex] = inputChannel[sampleIndex]
        this.bufferIndex++
        
        if (this.bufferIndex >= this.bufferSize) {
          // Convert to 16-bit PCM
          const pcmData = new Int16Array(this.bufferSize)
          for (let j = 0; j < this.bufferSize; j++) {
            // Clamp to [-1, 1] and convert to 16-bit
            const sample = Math.max(-1, Math.min(1, this.buffer[j]))
            pcmData[j] = Math.round(sample * 32767)
          }
          
          // Send PCM data to main thread
          this.port.postMessage({
            type: 'pcm-data',
            data: pcmData.buffer
          }, [pcmData.buffer])
          
          this.bufferIndex = 0
        }
      }
    }

    return true
  }
}

registerProcessor('pcm-encoder', PCMEncoderProcessor)


