/**
 * FaceNet Service for Web Dashboard
 * Generates 128-dimensional face embeddings using TensorFlow.js
 * Same model and preprocessing as mobile app for consistent results
 * 
 * Copyright (c) 2026 Neanv. All rights reserved.
 */

'use client';

import * as tf from '@tensorflow/tfjs';

export interface FaceEmbedding {
  embedding: Float32Array;
  dimensions: number;
  processingTime: number;
}

export interface FaceVerificationResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  threshold: number;
}

class FaceNetService {
  private model: tf.GraphModel | null = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  // Model configuration - matches mobile app
  private readonly MODEL_PATH = '/models/facenet/model.json';
  private readonly INPUT_SIZE = 160; // FaceNet input: 160x160
  private readonly EMBEDDING_SIZE = 128; // FaceNet output: 128 dims
  private readonly IMAGE_MEAN = 127.5; // Normalization mean
  private readonly IMAGE_STD = 128.0; // Normalization std
  private readonly SIMILARITY_THRESHOLD = 0.6; // 60% similarity = match
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.85; // 85% = high confidence

  /**
   * Load the FaceNet model (lazy loading on first use)
   */
  async loadModel(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this._loadModelInternal(onProgress);
    await this.loadPromise;
    this.isLoading = false;
  }

  private async _loadModelInternal(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log('🚀 Loading FaceNet model from:', this.MODEL_PATH);

      // Set backend to WebGL for GPU acceleration
      await tf.setBackend('webgl');
      await tf.ready();

      // Load model with progress tracking
      this.model = await tf.loadGraphModel(this.MODEL_PATH, {
        onProgress: (fraction) => {
          const progress = Math.round(fraction * 100);
          console.log(`📥 Loading model: ${progress}%`);
          onProgress?.(progress);
        },
      });

      this.isLoaded = true;
      console.log('✅ FaceNet model loaded successfully');
      console.log(
        `   Backend: ${tf.getBackend()}, Memory: ${JSON.stringify(
          tf.memory()
        )}`
      );
    } catch (error) {
      this.isLoaded = false;
      this.isLoading = false;
      console.error('❌ Failed to load FaceNet model:', error);
      throw new Error(
        'Failed to load face recognition model. Please ensure model files are available.'
      );
    }
  }

  /**
   * Generate face embedding from image File or base64
   */
  async generateEmbedding(
    imageInput: File | string
  ): Promise<FaceEmbedding> {
    const startTime = performance.now();

    // Ensure model is loaded
    if (!this.isLoaded) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      // Convert input to tensor
      const imageTensor = await this.preprocessImage(imageInput);

      // Run inference
      const outputTensor = this.model.predict(imageTensor) as tf.Tensor;
      const embeddingData = await outputTensor.data();

      // Convert to Float32Array
      const embedding = new Float32Array(embeddingData);

      // Validate embedding
      if (embedding.length !== this.EMBEDDING_SIZE) {
        throw new Error(
          `Invalid embedding size: expected ${this.EMBEDDING_SIZE}, got ${embedding.length}`
        );
      }

      // Cleanup tensors
      imageTensor.dispose();
      outputTensor.dispose();

      const processingTime = Math.round(performance.now() - startTime);

      console.log(
        `✅ Embedding generated: ${embedding.length} dims in ${processingTime}ms`
      );
      console.log(
        `   Range: [${Math.min(...embedding).toFixed(3)}, ${Math.max(
          ...embedding
        ).toFixed(3)}]`
      );

      return {
        embedding,
        dimensions: embedding.length,
        processingTime,
      };
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw new Error(`Face embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image to tensor (same as mobile app)
   * - Resize to 160x160
   * - Normalize to [-1, 1] using (pixel - 127.5) / 128.0
   */
  private async preprocessImage(
    imageInput: File | string
  ): Promise<tf.Tensor> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Convert image to tensor
          const tensor = tf.browser
            .fromPixels(img)
            .resizeBilinear([this.INPUT_SIZE, this.INPUT_SIZE])
            .toFloat();

          // Normalize: (pixel - 127.5) / 128.0 = range [-1, 1]
          // This matches the mobile app preprocessing
          const normalized = tensor
            .sub(this.IMAGE_MEAN)
            .div(this.IMAGE_STD)
            .expandDims(0); // Add batch dimension

          tensor.dispose();
          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load image from File or base64
      if (typeof imageInput === 'string') {
        // Base64 string
        img.src = imageInput.startsWith('data:')
          ? imageInput
          : `data:image/jpeg;base64,${imageInput}`;
      } else {
        // File object
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(imageInput);
      }
    });
  }

  /**
   * Compare two embeddings using cosine similarity
   * Returns similarity score (0-1, higher = more similar)
   */
  cosineSimilarity(
    embedding1: Float32Array,
    embedding2: Float32Array
  ): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Verify if two faces match
   */
  async verifyFaces(
    image1: File | string,
    image2: File | string
  ): Promise<FaceVerificationResult> {
    const [result1, result2] = await Promise.all([
      this.generateEmbedding(image1),
      this.generateEmbedding(image2),
    ]);

    const similarity = this.cosineSimilarity(
      result1.embedding,
      result2.embedding
    );

    const isMatch = similarity >= this.SIMILARITY_THRESHOLD;
    const confidence = Math.round(similarity * 100);

    return {
      similarity,
      isMatch,
      confidence,
      threshold: this.SIMILARITY_THRESHOLD,
    };
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isLoaded && this.model !== null;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      inputSize: this.INPUT_SIZE,
      embeddingSize: this.EMBEDDING_SIZE,
      similarityThreshold: this.SIMILARITY_THRESHOLD,
      highConfidenceThreshold: this.HIGH_CONFIDENCE_THRESHOLD,
      backend: tf.getBackend(),
      isLoaded: this.isLoaded,
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isLoaded = false;
    console.log('🧹 FaceNet model disposed');
  }
}

// Singleton instance
export const faceNetService = new FaceNetService();
