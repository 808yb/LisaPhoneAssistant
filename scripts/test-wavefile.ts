import wavefile from 'wavefile';
const { WaveFile } = wavefile;

const dummyMulaw = Buffer.alloc(100, 255); // 100 samples of 8kHz mu-law (12.5ms)

const wav = new WaveFile();
wav.fromScratch(1, 8000, '8m', dummyMulaw);
wav.fromMuLaw();
wav.toSampleRate(16000);
wav.toBitDepth('16'); 

const samples16k = wav.data.samples as any; 
const int16Samples = new Int16Array(samples16k.buffer, samples16k.byteOffset, samples16k.byteLength / 2);
console.log("int16Samples length:", int16Samples.length);

const wav2 = new WaveFile();
wav2.fromScratch(1, 16000, '16', int16Samples);
wav2.toSampleRate(8000);
wav2.toMuLaw(); 

const samples8kMulaw = wav2.data.samples as any;
console.log("samples8kMulaw length:", samples8kMulaw.length);
