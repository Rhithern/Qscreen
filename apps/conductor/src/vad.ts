export class VoiceActivityDetector {
  private energyThreshold: number;
  private silenceThreshold: number;
  private energyHistory: number[] = [];
  private historySize: number;
  private isSpeaking: boolean = false;

  constructor(
    energyThreshold: number = 0.01,
    silenceThreshold: number = 0.005,
    historySize: number = 10
  ) {
    this.energyThreshold = energyThreshold;
    this.silenceThreshold = silenceThreshold;
    this.historySize = historySize;
  }

  processAudio(audioData: ArrayBuffer): boolean {
    const samples = new Int16Array(audioData);
    const energy = this.calculateEnergy(samples);
    
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    
    const wasSpeaking = this.isSpeaking;
    
    if (avgEnergy > this.energyThreshold) {
      this.isSpeaking = true;
    } else if (avgEnergy < this.silenceThreshold) {
      this.isSpeaking = false;
    }

    // Return true if speech just started
    return !wasSpeaking && this.isSpeaking;
  }

  private calculateEnergy(samples: Int16Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += (samples[i] / 32768) ** 2;
    }
    return sum / samples.length;
  }

  setThresholds(energyThreshold: number, silenceThreshold: number) {
    this.energyThreshold = energyThreshold;
    this.silenceThreshold = silenceThreshold;
  }

  reset() {
    this.energyHistory = [];
    this.isSpeaking = false;
  }
}


